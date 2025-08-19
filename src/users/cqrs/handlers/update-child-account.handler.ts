import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateChildAccountCommand } from '../commands/update-child-account.command';
import { UserService } from '../../user/user.service';
import { User } from '../../user.entity';

@CommandHandler(UpdateChildAccountCommand)
export class UpdateChildAccountHandler
  implements ICommandHandler<UpdateChildAccountCommand>
{
  constructor(private readonly userService: UserService) {}
  async execute(command: UpdateChildAccountCommand): Promise<User> {
    const { childId, updateUserDto, currentUser } = command;
    const childUser = await this.userService.findOneOrFail(childId);

    await this.userService.checkParentUser(childUser, currentUser);

    return await this.userService.updateUser(childUser, updateUserDto);
  }
}
