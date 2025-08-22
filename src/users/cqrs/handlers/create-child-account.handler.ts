import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateChildAccountCommand } from '../commands/create-child-account.command';
import { User } from '../../user.entity';
import { ConflictException } from '@nestjs/common';
import { Role } from '../../role.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordService } from '../../password/password.service';

@CommandHandler(CreateChildAccountCommand)
export class CreateChildAccountHandler
  implements ICommandHandler<CreateChildAccountCommand, User>
{
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(command: CreateChildAccountCommand): Promise<User> {
    const { createUser, parentId } = command;
    const email = createUser.email;
    const existingChildUser = await this.userRepository.findOneBy({ email });

    if (existingChildUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await this.passwordService.hash(createUser.password);

    const user = this.userRepository.create({
      ...createUser,
      password: hashedPassword,
      role: Role.CHILD,
      parentId: parentId,
    });

    return await this.userRepository.save(user);
  }
}
