import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetChildrenListQuery } from '../queries/get-children-list.query';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../user.entity';
import { Repository } from 'typeorm';

@QueryHandler(GetChildrenListQuery)
export class GetChildrenListHandler
  implements IQueryHandler<GetChildrenListQuery>
{
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  execute(query: GetChildrenListQuery): Promise<[User[], number]> {
    const { pagination, currentUser } = query;
    const parentId = currentUser.id;
    const listQuery = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.badges', 'userBadge')
      .leftJoinAndSelect('userBadge.badge', 'badge')
      .where('user.parentId = :parentId', { parentId });

    listQuery.skip(pagination.offset).take(pagination.limit);
    return listQuery.getManyAndCount();
  }
}
