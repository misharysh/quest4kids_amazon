import { IQuery } from '@nestjs/cqrs';
import { CurrentUserDto } from '../../dto/current-user.dto';
import { FindOneParams } from '../../../tasks/dto/find-one.params';

export class GetAvatarQuery implements IQuery {
  constructor(
    public readonly params: FindOneParams,
    public readonly currentUser: CurrentUserDto,
  ) {}
}
