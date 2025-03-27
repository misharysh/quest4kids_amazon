import { Module } from '@nestjs/common';
import { TasksService } from './task/tasks.service';
import { TasksController } from './task/tasks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { TaskLabel } from './task-label.entity';
import { UsersModule } from './../users/users.module';
import { User } from './../users/user.entity';
import { UserTaskCompletion } from './../users/user-task-completion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, TaskLabel, User, UserTaskCompletion]), UsersModule],
  controllers: [TasksController],
  providers: [TasksService]
})
export class TasksModule {}
