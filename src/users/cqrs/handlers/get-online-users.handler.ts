import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserWithOnlineStatusDto } from '../../dto/user-with-online-status.dto';
import { Role } from '../../role.enum';
import { User } from '../../user.entity';
import { PaginationParams } from '../../../common/pagination.params';
import { GetOnlineUsersQuery } from '../queries/get-online-users.query';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OnlineService } from '../../online/online.service';

@QueryHandler(GetOnlineUsersQuery)
export class GetOnlineUsersHandler
  implements IQueryHandler<GetOnlineUsersQuery>
{
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly onlineService: OnlineService,
  ) {}
  async execute(
    query: GetOnlineUsersQuery,
  ): Promise<UserWithOnlineStatusDto[]> {
    const { currentUser } = query;
    const isParent = currentUser.role === Role.PARENT;

    let usersWithOnlineStatus: User[] = [];

    if (isParent) {
      const pagination = new PaginationParams();
      const parentId = currentUser.id;
      const query = this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.badges', 'userBadge')
        .leftJoinAndSelect('userBadge.badge', 'badge')
        .where('user.parentId = :parentId', { parentId });

      query.skip(pagination.offset).take(pagination.limit);

      const [items, total] = await query.getManyAndCount();
      usersWithOnlineStatus = items;
    } else {
      const id = currentUser.id;
      const child = await this.userRepository.findOne({
        where: { id: id },
      });

      if (!child) {
        throw new NotFoundException('Child not found');
      }

      if (!child.parentId) {
        throw new BadRequestException('This user has no parent');
      }

      const parentUser = await this.userRepository.findOne({
        where: { id: child.parentId },
      });

      if (parentUser) {
        usersWithOnlineStatus.push(parentUser);
      }
    }

    return usersWithOnlineStatus.map((user) => ({
      ...user,
      isOnline: this.onlineService.isUserOnline(user.id),
    }));
  }
}
