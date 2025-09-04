import { CommandBus, ICommandHandler } from '@nestjs/cqrs';
import { UpdateTaskCommand } from '../commands/update-task.command';
import { Repository } from 'typeorm';
import { Task } from 'src/tasks/task.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { TaskLabel } from 'src/tasks/task-label.entity';
import { User } from 'src/users/user.entity';
import { UserTaskCompletion } from 'src/users/user-task-completion.entity';
import { TaskStatusLoggerService } from 'src/tasks/task-status-log/task-status-logger.service';
import { TelegramService } from 'src/telegram/telegram.service';
import { NotificationService } from 'src/notifications/notification.service';
import { CurrentUserDto } from 'src/users/dto/current-user.dto';
import { TaskStatus } from 'src/tasks/task.model';
import { CreateTaskCommentCommand } from '../commands/create-task-comment.command';
import { Role } from 'src/users/role.enum';
import { SetRewardCommand } from 'src/badges/cqrs/commands/set-rewards.command';
import { WrongTaskStatusException } from 'src/tasks/exceptions/wrong-task-status.exception';
import { TaskLabelEnum } from 'src/tasks/task-label.enum';
import { ForbiddenException } from '@nestjs/common';

export class UpdateTaskHandler
  implements ICommandHandler<UpdateTaskCommand, Task>
{
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    @InjectRepository(TaskLabel)
    private readonly labelsRepository: Repository<TaskLabel>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(UserTaskCompletion)
    private readonly userTaskCompletionsRepository: Repository<UserTaskCompletion>,
    private readonly statusLogger: TaskStatusLoggerService,
    private readonly telegramService: TelegramService,
    private readonly notificationService: NotificationService,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: UpdateTaskCommand): Promise<Task> {
    const { taskId, updateTaskDto, currentUser } = command;

    const task = await this.tasksRepository.findOneByOrFail({ id: taskId });
    this.checkTaskOwnership(task, currentUser);

    const { labels, ...taskData } = updateTaskDto;
    const comment = updateTaskDto.comment;

    if (labels && labels.length > 0) {
      const uniqueLabels = this.getUniqueLabels(labels).map((label) =>
        this.labelsRepository.create({ name: label as TaskLabelEnum }),
      );

      task.labels = uniqueLabels;
      task.updatedAt = new Date();
    }

    const userForComment = await this.usersRepository.findOneBy({
      id: task.userId,
    });

    await this.commandBus.execute(
      new CreateTaskCommentCommand(userForComment, task, comment),
    );

    if (taskData.status) {
      if (!this.isValidStatusTransition(task.status, taskData.status)) {
        throw new WrongTaskStatusException();
      }

      const user = await this.usersRepository.findOneBy({ id: task.userId });

      await this.statusLogger.createStatusLog(
        user,
        task,
        taskData.status,
        task.status,
      );

      if (user?.role === Role.CHILD && user.parentId) {
        const parent = await this.usersRepository.findOneBy({
          id: user.parentId,
        });
        if (parent?.telegramChatId) {
          const message =
            `👶 <b>Обновление задачи ребенка</b>\n\n` +
            `Ребенок: <b>${user.name}</b>\n` +
            `Задача: <b>${task.title}</b>\n` +
            `Новый статус: <b>${taskData.status}</b>`;

          await this.telegramService.sendMessage(
            parent.telegramChatId,
            message,
          );
        }
      }

      if (taskData.status === TaskStatus.DONE && user) {
        const points = taskData.points ?? task.points ?? 0;

        user.availablePoints += points;
        user.totalEarnedPoints += points;
        await this.usersRepository.save(user);

        const userTaskCompletion = new UserTaskCompletion();
        userTaskCompletion.user = user;
        userTaskCompletion.task = task;
        userTaskCompletion.points = points;
        await this.userTaskCompletionsRepository.save(userTaskCompletion);

        await this.commandBus.execute(
          // ⬅️ изменено: теперь SetReward вызывается как отдельная команда
          new SetRewardCommand(task.labels, user.id),
        );

        if (user.role === Role.CHILD && user.parentId) {
          const message = `${user.name} changed status of task: ${task.title} -> ${taskData.status}`;
          await this.notificationService.createForUser(user.parentId, message);
        }
      }
    }

    Object.assign(task, taskData);
    await this.tasksRepository.save(task);

    task.actualTime = await this.statusLogger.getTaskTime(task.id);

    return await this.tasksRepository.save(task);
  }

  private async checkTaskOwnership(
    task: Task,
    currentUser: CurrentUserDto,
  ): Promise<void> {
    const isParent = currentUser.role === Role.PARENT;

    if (isParent) {
      const parentId = currentUser.id;
      const query = this.usersRepository
        .createQueryBuilder('user')
        .where('user.parentId = :parentId', { parentId });

      const items = await query.getMany();

      if (!items.some((user) => user.id === task.userId)) {
        throw new ForbiddenException(
          'You can only access tasks of you children',
        );
      }
    } else {
      if (task.userId !== currentUser.id) {
        throw new ForbiddenException('You can only access your tasks');
      }
    }
  }

  private isValidStatusTransition(
    current: TaskStatus,
    next: TaskStatus,
  ): boolean {
    const statusOrder = [
      TaskStatus.OPEN,
      TaskStatus.IN_PROGRESS,
      TaskStatus.DONE,
    ];

    return statusOrder.indexOf(current) < statusOrder.indexOf(next);
  }

  private getUniqueLabels(labels: string[]): string[] {
    return [...new Set(labels.map((l) => l.trim().toLowerCase()))];
  }
}
