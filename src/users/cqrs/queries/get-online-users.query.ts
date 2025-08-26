import { IQuery } from '@nestjs/cqrs';
import { CurrentUserDto } from '../../dto/current-user.dto';

export class GetOnlineUsersQuery implements IQuery {
  constructor(public readonly currentUser: CurrentUserDto) {}
}
