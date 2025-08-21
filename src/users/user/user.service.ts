import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordService } from '../password/password.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { Role } from '../role.enum';
import { PaginationParams } from '../../common/pagination.params';
import { AwsService } from '../../aws/aws.service';
import { CurrentUserDto } from '../dto/current-user.dto';
import { DashboardSettingsService } from '../../dashboardSettings/dashboard-settings.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly passwordService: PasswordService,
    private readonly awsService: AwsService,
    private readonly dashboardSettings: DashboardSettingsService,
  ) {}

  public async findOneByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ email });
  }

  public async findOne(id: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id: id },
      relations: ['badges', 'badges.badge'],
    });
  }

  public async findParentByChildId(id: string): Promise<User | null> {
    const child = await this.userRepository.findOne({
      where: { id: id },
    });

    if (!child) {
      throw new NotFoundException('Child not found');
    }

    if (!child.parentId) {
      throw new BadRequestException('This user has no parent');
    }

    const parent = await this.userRepository.findOne({
      where: { id: child.parentId },
    });

    return parent;
  }

  public async findAll(
    pagination: PaginationParams,
    parentId: string,
  ): Promise<[User[], number]> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.badges', 'userBadge')
      .leftJoinAndSelect('userBadge.badge', 'badge')
      .where('user.parentId = :parentId', { parentId });

    query.skip(pagination.offset).take(pagination.limit);

    return query.getManyAndCount();
  }

  public async findOneOrFail(id: string): Promise<User> {
    const user = await this.findOne(id);

    if (!user) {
      throw new NotFoundException();
    }

    return user;
  }

  public async createUser(
    createUserDto: CreateUserDto,
    role: Role,
    parentId?: string,
  ): Promise<User> {
    const hashedPassword = await this.passwordService.hash(
      createUserDto.password,
    );

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: role,
      parentId: parentId,
    });

    const savedUser = await this.userRepository.save(user);

    //created default dashboard settings only for PARENT
    if (role == Role.PARENT) {
      await this.dashboardSettings.createDefaultForUser(savedUser);
    }

    return savedUser;
  }

  public async createChildAccount(
    createUserDto: CreateUserDto,
    parentId: string,
  ): Promise<User> {
    const existingChildUser = await this.findOneByEmail(createUserDto.email);

    if (existingChildUser) {
      throw new ConflictException('Email already exists');
    }

    const childUserRole = Role.CHILD;

    const user = await this.createUser(createUserDto, childUserRole, parentId);

    return user;
  }

  public async updateUser(user: User): Promise<User> {
    return await this.userRepository.save(user);
  }

  public async saveUser(user: User): Promise<User> {
    return await this.userRepository.save(user);
  }

  public async deleteUser(user: User): Promise<void> {
    await this.userRepository.remove(user);
  }

  public async claimPoints(user: User, exchangePoints: number): Promise<User> {
    if (exchangePoints > user.availablePoints) {
      throw new ConflictException("You can't exchange that many points");
    }

    user.availablePoints -= exchangePoints;

    return await this.userRepository.save(user);
  }

  public async getAvatar(key: string): Promise<string> {
    const url = await this.awsService.s3_get(key);

    return url;
  }

  public async addAvatar(user: User, file: Express.Multer.File): Promise<User> {
    if (user.avatarName) {
      await this.deleteAvatar(user.avatarName);
    }

    const awsResponse = await this.awsService.s3_upload(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    user.avatarName = awsResponse.Key;

    return await this.userRepository.save(user);
  }

  public async deleteAvatar(key: string): Promise<void> {
    await this.awsService.s3_delete(key);
  }

  public async checkAvatarOwnership(
    id: string,
    currentUser: CurrentUserDto,
  ): Promise<User> {
    const isParent = currentUser.role === Role.PARENT;

    if (isParent) {
      if (id === currentUser.id) {
        return await this.findOneOrFail(id);
      } else {
        const pagination = new PaginationParams();
        const [items, total] = await this.findAll(pagination, currentUser.id);

        if (!items.some((user) => user.id === id)) {
          throw new ForbiddenException(
            'You can only access avatars of your children',
          );
        }

        const user = items.find((user) => user.id === id);

        if (user) {
          return user;
        } else {
          throw new NotFoundException('User Not Found');
        }
      }
    } else {
      if (id !== currentUser.id) {
        throw new ForbiddenException('You can only access your avatar');
      }

      return await this.findOneOrFail(id);
    }
  }

  public async checkParentUser(
    child: User,
    parent: CurrentUserDto,
  ): Promise<void> {
    //check if this childUser has ParentId as current user id
    if (child.parentId !== parent.id) {
      throw new ForbiddenException('You can only access your children');
    }
  }

  public async checkUserCompatibility(
    withUserId: string,
    currentUser: CurrentUserDto,
  ): Promise<boolean> {
    const isParent = currentUser.role === Role.PARENT;
    if (isParent) {
      //check if parent has child 'withUserId'
      const childUser = await this.findOne(withUserId);
      if (childUser && childUser.parentId === currentUser.id) {
        return true;
      }
    } else {
      //check if child has parent 'withUserId'
      const childUser = await this.findOne(currentUser.id);
      if (childUser && childUser.parentId === withUserId) {
        return true;
      }
    }

    return false;
  }

  async updateTelegramChatId(
    userId: string,
    telegramChatId: string,
  ): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.telegramChatId = telegramChatId;
    return this.userRepository.save(user);
  }
}
