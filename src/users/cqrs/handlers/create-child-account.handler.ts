import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateChildAccountCommand } from '../commands/create-child-account.command';
import { User } from '../../user.entity';
import { ConflictException } from '@nestjs/common';
import { Role } from '../../role.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PasswordService } from '../../password/password.service';
import { ZitadelIdentityService } from 'src/identityService/zitadel-identity.service';
import { IdentityUser } from 'src/identityService/Identity.service';

@CommandHandler(CreateChildAccountCommand)
export class CreateChildAccountHandler
  implements ICommandHandler<CreateChildAccountCommand, User>
{
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly passwordService: PasswordService,
    private readonly dataSource: DataSource,
    private readonly zitadelIdentityService: ZitadelIdentityService,
  ) {}

  // @ts-ignore
  async execute(command: CreateChildAccountCommand): Promise<User> {
    const { createUser, parentId } = command;
    const email = createUser.email;

    const existingChildUser = await this.userRepository.findOneBy({ email });
    if (existingChildUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await this.passwordService.hash(createUser.password);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('READ COMMITTED');
    let createdZitadelUserId: string | undefined;

    try {
      const user = queryRunner.manager.getRepository(User).create({
        ...createUser,
        password: hashedPassword,
        role: Role.CHILD,
        parentId: parentId,
      });

      const savedUser = await queryRunner.manager
        .getRepository(User)
        .save(user);

      const identityUser: IdentityUser = new IdentityUser();
      identityUser.email = savedUser.email;
      identityUser.firstName = savedUser.name;
      identityUser.initialPassword = createUser.password;
      identityUser.lastName = savedUser.name;
      identityUser.userName = savedUser.name;

      const zitadelResult =
        await this.zitadelIdentityService.createUser(identityUser);
      createdZitadelUserId = zitadelResult.userId;

      savedUser.externalId = zitadelResult.userId;

      const finalUser = await queryRunner.manager
        .getRepository(User)
        .save(savedUser);

      await queryRunner.commitTransaction();
      return finalUser;
    } catch (error) {
      if (createdZitadelUserId) {
        try {
          await this.zitadelIdentityService.deleteUser(createdZitadelUserId);
        } catch {
          console.log('Error deleting user from Zitadel', error);
        }

        await queryRunner.rollbackTransaction();
        throw error;
      }
    } finally {
      await queryRunner.release();
    }
  }
}
