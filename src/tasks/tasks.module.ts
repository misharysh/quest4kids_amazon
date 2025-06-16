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
  ],
  controllers: [TasksController],
  providers: [TasksService, TaskStatusLoggerService],
  exports: [TasksService],
})
export class TasksModule {}
