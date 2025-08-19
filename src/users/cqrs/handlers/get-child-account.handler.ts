import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetChildAccountQuery } from '../queries/get-child-account.query';
import { User } from '../../user.entity';
import { UserService } from '../../user/user.service';

@QueryHandler(GetChildAccountQuery)
export class GetChildAccountHandler
  implements IQueryHandler<GetChildAccountQuery>
{
  constructor(private readonly userService: UserService) {}

  async execute(query: GetChildAccountQuery): Promise<User> {
    const { params, currentUser } = query;
    const childUser = await this.userService.findOneOrFail(params.id);

    await this.userService.checkParentUser(childUser, currentUser);

    return childUser;
  }
}
