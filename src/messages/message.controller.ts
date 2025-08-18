import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../users/decorators/current-user.decorator';
import { CurrentUserDto } from '../users/dto/current-user.dto';
import { MessageParams } from './dto/message.params';
import { Message } from './message.entity';
import { GetMessagesQuery } from './cqrs/queries/get-messages.query';
import { QueryBus } from '@nestjs/cqrs';

@Controller()
export class MessageController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('messages')
  public async getMessages(
    @Query() messageParams: MessageParams,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<Message[]> {
    return this.queryBus.execute(
      new GetMessagesQuery(messageParams.withUserId, currentUser),
    );
  }
}
