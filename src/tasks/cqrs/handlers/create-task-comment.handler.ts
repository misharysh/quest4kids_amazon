import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { TaskCommentsEntity } from 'src/tasks/entities/task-comments.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { CreateTaskCommentCommand } from '../commands/create-task-comment.command';
import { Role } from 'src/users/role.enum';
import { TelegramService } from 'src/telegram/telegram.service';
import { InternalServerErrorException } from '@nestjs/common';

@CommandHandler(CreateTaskCommentCommand)
export class CreateTaskCommentHandler
  implements ICommandHandler<CreateTaskCommentCommand, void>
{
  constructor(
    @InjectRepository(TaskCommentsEntity)
    private readonly taskCommentsRepository: Repository<TaskCommentsEntity>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly telegramService: TelegramService,
  ) {}

  async execute(command: CreateTaskCommentCommand): Promise<void> {
    const { user, task, comment } = command;

    if (!user) {
      throw new InternalServerErrorException();
    }

    if (!comment || comment.trim().length === 0) return;

    const taskComment = this.taskCommentsRepository.create({
      task: task,
      comment: comment.trim(),
      user: user,
    });

    await this.taskCommentsRepository.save(taskComment);

    if (user?.role === Role.CHILD && user.parentId) {
      const parent = await this.usersRepository.findOneBy({
        id: user.parentId,
      });

      if (parent?.telegramChatId) {
        const message =
          `👶 💬 <b>Новый комментарий к задаче ребенка</b>\n\n` +
          `Ребенок: <b>${user.name}</b>\n` +
          `Задача: <b>${task.title}</b>\n` +
          `От: <b>${user.name}</b>\n` +
          `Комментарий: <i>${comment}</i>`;

        await this.telegramService.sendMessage(parent.telegramChatId, message);
      }
    }
  }
}
