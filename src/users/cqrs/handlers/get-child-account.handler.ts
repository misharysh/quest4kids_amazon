import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetChildAccountQuery } from '../queries/get-child-account.query';
import { User } from '../../user.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@QueryHandler(GetChildAccountQuery)
export class GetChildAccountHandler
  implements IQueryHandler<GetChildAccountQuery>
{
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async execute(query: GetChildAccountQuery): Promise<User> {
    const { params, currentUser } = query;

    const user = await this.userRepository.findOne({
      where: { id: params.id },
      relations: ['badges', 'badges.badge'],
    });

    if (!user) {
      throw new NotFoundException();
    }

    if (user.parentId !== currentUser.id) {
      throw new ForbiddenException('You can only access your children');
    }

    return user;
  }
}
