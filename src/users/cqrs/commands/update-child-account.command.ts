import { ICommand } from '@nestjs/cqrs';
import { CurrentUserDto } from '../../dto/current-user.dto';
import { User } from '../../user.entity';
import { AuthenticatedCommand } from './authenticated.command';

export class UpdateChildAccountCommand
  extends AuthenticatedCommand
  implements ICommand
{
  constructor(
    public readonly childId: string,
    currentUser: CurrentUserDto,
    public readonly applyChanges: (user: User) => Promise<void>,
  ) {
    super(currentUser);
  }
}
