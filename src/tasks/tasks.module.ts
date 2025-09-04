import { forwardRef, Module } from '@nestjs/common';
import { TasksService } from './task/tasks.service';
import { TasksController } from './task/tasks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { TaskLabel } from './task-label.entity';
import { UsersModule } from './../users/users.module';
import { User } from './../users/user.entity';
import { UserTaskCompletion } from './../users/user-task-completion.entity';
import { Badge } from '../badges/badge.entity';
import { UserBadge } from '../badges/user-badge.entity';
import { NotificationModule } from '../notifications/notification.module';
import { RedisModule } from '../redis/redis.module';
import { TaskCommentsEntity } from './entities/task-comments.entity';
import { TaskStatusLogsEntity } from './entities/task-status-logs.entity';
import { TaskStatusLoggerService } from './task-status-log/task-status-logger.service';
import { CommunicationClientModule } from '../communication/communication-client.module';
import { TelegramModule } from '../telegram/telegram.module';
import { CqrsModule } from '@nestjs/cqrs';
import { GetTaskListHandler } from './cqrs/handlers/get-task-list.handler';
import { CreateTaskHandler } from './cqrs/handlers/create-task.handler';
import { CreateTaskCommentHandler } from './cqrs/handlers/create-task-comment.handler';
import { CreateTasksFromCsvHandler } from './cqrs/handlers/create-tasks-from-csv.handlers';
import { GenerateTaskHandler } from './cqrs/handlers/generate-task.handler';
import { UpdateTaskHandler } from './cqrs/handlers/update-task.handler';

const Handlers = [
  GetTaskListHandler,
  CreateTaskHandler,
  CreateTaskCommentHandler,
  CreateTasksFromCsvHandler,
  GenerateTaskHandler,
  UpdateTaskHandler,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      TaskLabel,
      User,
      UserTaskCompletion,
      Badge,
      UserBadge,
      TaskCommentsEntity,
      TaskStatusLogsEntity,
    ]),
    UsersModule,
    forwardRef(() => RedisModule),
    CommunicationClientModule,
    forwardRef(() => NotificationModule),
    TelegramModule,
    CqrsModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, TaskStatusLoggerService, ...Handlers],
  exports: [TasksService],
})
export class TasksModule {}
