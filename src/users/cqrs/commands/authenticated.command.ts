import { ICommand } from '@nestjs/cqrs';
import { CurrentUserDto } from '../../dto/current-user.dto';

export abstract class AuthenticatedCommand implements ICommand {
  protected constructor(public readonly currentUser: CurrentUserDto) {}
}
