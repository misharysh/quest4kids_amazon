import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetMessagesQuery } from '../queries/get-messages.query';
import { MessageService } from '../../message.service';
import { UserService } from '../../../users/user/user.service';
import { Message } from '../../message.entity';

@QueryHandler(GetMessagesQuery)
export class GetMessagesHandler implements IQueryHandler<GetMessagesQuery> {
  constructor(
    private readonly messageService: MessageService,
    private readonly userService: UserService,
  ) {}

  async execute(query: GetMessagesQuery): Promise<Message[]> {
    const { withUserId, currentUser } = query;

    const isUsersCompatible = await this.userService.checkUserCompatibility(
      withUserId,
      currentUser,
    );

    if (!isUsersCompatible) {
      return [];
    }

    return this.messageService.getMessages(withUserId, currentUser.id);
  }
}
