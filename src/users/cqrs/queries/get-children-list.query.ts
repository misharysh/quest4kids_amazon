import { IQuery } from '@nestjs/cqrs';
import { PaginationParams } from '../../../common/pagination.params';
import { CurrentUserDto } from '../../dto/current-user.dto';

export class GetChildrenListQuery implements IQuery {
  constructor(
    public readonly pagination: PaginationParams,
    public readonly currentUser: CurrentUserDto,
  ) {}
}
