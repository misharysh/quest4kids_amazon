import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateChildAccountCommand } from '../commands/create-child-account.command';
import { User } from '../../user.entity';
import { UserService } from '../../user/user.service';

@CommandHandler(CreateChildAccountCommand)
export class CreateChildAccountHandler
  implements ICommandHandler<CreateChildAccountCommand, User>
{
  constructor(private readonly userService: UserService) {}

  async execute(command: CreateChildAccountCommand): Promise<User> {
    const { createUser, currentUser } = command;
    return this.userService.createChildAccount(createUser, currentUser.id);
  }
}
