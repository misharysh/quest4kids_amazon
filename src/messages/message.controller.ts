import { Controller, Get, Query } from '@nestjs/common';
import { MessageService } from './message.service';
import { CurrentUser } from '../users/decorators/current-user.decorator';
import { CurrentUserDto } from '../users/dto/current-user.dto';
import { MessageParams } from './dto/message.params';
import { UserService } from '../users/user/user.service';
import { Message } from './message.entity';

@Controller()
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly userService: UserService,
  ) {}

  @Get('messages')
  public async getMessages(
    @Query() messageParams: MessageParams,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<Message[]> {
    let messages: Message[] = [];
    const isUsersCompatible = await this.userService.checkUserCompatibility(
      messageParams.withUserId,
      currentUser,
    );

    if (isUsersCompatible) {
      messages = await this.messageService.getMessages(
        messageParams.withUserId,
        currentUser.id,
      );
    }

    return messages;
  }
}
