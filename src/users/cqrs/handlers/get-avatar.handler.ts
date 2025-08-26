import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAvatarQuery } from '../queries/get-avatar.query';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../user.entity';
import { Repository } from 'typeorm';
import { AwsService } from '../../../aws/aws.service';
import { Role } from '../../role.enum';
import { PaginationParams } from '../../../common/pagination.params';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

@QueryHandler('get-avatar')
export class GetAvatarHandler implements IQueryHandler<GetAvatarQuery> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly awsService: AwsService,
  ) {}
  async execute(query: GetAvatarQuery): Promise<string> {
    const { params, currentUser } = query;
    const id = params.id;
    const isParent = currentUser.role === Role.PARENT;
    let user: User | null | undefined;

    if (isParent) {
      if (id === currentUser.id) {
        user = await this.userRepository.findOne({
          where: { id: id },
          relations: { badges: { badge: true } },
        });
      } else {
        const pagination = new PaginationParams();
        const parentId = currentUser.id;
        const query = this.userRepository
          .createQueryBuilder('user')
          .leftJoinAndSelect('user.badges', 'userBadge')
          .leftJoinAndSelect('userBadge.badge', 'badge')
          .where('user.parentId = :parentId', { parentId });

        query.skip(pagination.offset).take(pagination.limit);

        const [items, total] = await query.getManyAndCount();

        if (!items.some((user) => user.id === id)) {
          throw new ForbiddenException(
            'You can only access avatars of your children',
          );
        }

        user = items.find((user) => user.id === id);
      }
    } else {
      if (id !== currentUser.id) {
        throw new ForbiddenException('You can only access your avatar');
      }

      user = await this.userRepository.findOne({
        where: { id: id },
        relations: { badges: { badge: true } },
      });
    }
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.avatarName) {
      return '';
    }
    const url = await this.awsService.s3_get(user.avatarName);
    return url;
  }
}
