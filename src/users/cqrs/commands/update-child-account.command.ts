import { ICommand } from '@nestjs/cqrs';
import { CurrentUserDto } from '../../dto/current-user.dto';
import { User } from '../../user.entity';

export class UpdateChildAccountCommand implements ICommand {
  constructor(
    public readonly childId: string,
    public readonly currentUser: CurrentUserDto,
    public readonly applyChanges: (user: User) => Promise<void>,
  ) {}
}
