import { ConflictException, Injectable } from '@nestjs/common';
import { User } from '../user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordService } from '../password/password.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { Role } from '../role.enum';
import { PaginationParams } from 'src/common/pagination.params';
import { UpdateUserDto } from '../dto/update-user.dto';
import { AwsService } from '../../aws/aws.service';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly passwordService: PasswordService,
        private readonly awsService: AwsService 
    ) {};

    public async findOneByEmail (email: string): Promise<User | null>
    {
        return await this.userRepository.findOneBy({email});
    };

    public async findOne(id: string): Promise<User | null>
    {
        return await this.userRepository.findOneBy({id});
    };

    public async findAll(pagination: PaginationParams, parentId: string): Promise<[User[], number]>
    {
        const query = this.userRepository.createQueryBuilder('user')
            .where('user.parentId = :parentId', {parentId});

        query.skip(pagination.offset).take(pagination.limit);

        return query.getManyAndCount();
    };

    public async createUser(createUserDto: CreateUserDto, role: Role, parentId?: string): Promise<User>
    {
        const hashedPassword = await this.passwordService.hash(createUserDto.password);

        const user = this.userRepository.create({
            ...createUserDto,
            password: hashedPassword,
            role: role,
            parentId: parentId
        });

        return await this.userRepository.save(user);
    };

    public async createChildAccount(createUserDto: CreateUserDto, parentId: string): Promise<User>
    {
        const existingChildUser = await this.findOneByEmail(createUserDto.email);

        if (existingChildUser)
        {
            throw new ConflictException('Email already exists');
        }

        const childUserRole = Role.CHILD;

        const user = await this.createUser(createUserDto, childUserRole, parentId);

        return user;
    };

    public async updateUser(user: User, updateUserDto: UpdateUserDto): Promise<User>
    {
        Object.assign(user, updateUserDto);

        return await this.userRepository.save(user);
    };

    public async deleteUser(user: User): Promise<void>
    {
        await this.userRepository.remove(user);
    }

    public async addAvatar(user: User, file: Express.Multer.File): Promise<User>
    {
        if (user.avatarName)
        {
            await this.deleteAvatar(user.avatarName);
        }

        const awsResponse = await this.awsService.s3_upload(
            file.buffer,
            file.originalname,
            file.mimetype
        );

        user.avatarName = awsResponse.Key;

        return await this.userRepository.save(user);
    };

    public async deleteAvatar(key: string): Promise<void>
    {
        await this.awsService.s3_delete(key);
    };

    public async getAvatar(key: string): Promise<string>
    {
        const url = await this.awsService.s3_get(key);

        return url;
    };
}
