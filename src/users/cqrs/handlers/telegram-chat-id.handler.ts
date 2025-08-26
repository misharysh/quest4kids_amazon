import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TelegramChatIdCommand } from '../commands/telegram-chat-id.command';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../user.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

@CommandHandler(TelegramChatIdCommand)
export class TelegramChatIdHandler
  implements ICommandHandler<TelegramChatIdCommand>
{
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  async execute(command: TelegramChatIdCommand): Promise<User> {
    const { currentUser, updateTelegramChatIdDto } = command;
    const id = currentUser.id;
    const user = await this.userRepository.findOneBy({ id: id });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.telegramChatId = updateTelegramChatIdDto.telegramChatId;
    return this.userRepository.save(user);
  }
}
