import { IQuery } from '@nestjs/cqrs';
import { CurrentUserDto } from '../../../users/dto/current-user.dto';

export class GetMessagesQuery implements IQuery {
  constructor(
    public readonly withUserId: string,
    public readonly currentUser: CurrentUserDto,
  ) {}
}
