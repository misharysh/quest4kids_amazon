import { ICommand } from '@nestjs/cqrs';
import { CurrentUserDto } from '../../dto/current-user.dto';
import { UpdateTelegramChatIdDto } from '../../dto/update-telegram-chat-id.dto';

export class TelegramChatIdCommand implements ICommand {
  constructor(
    public readonly currentUser: CurrentUserDto,
    public readonly updateTelegramChatIdDto: UpdateTelegramChatIdDto,
  ) {}
}
