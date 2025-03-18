import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { TaskLabel } from './task-label.entity';
import { UsersModule } from 'src/users/users.module';
import { User } from 'src/users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, TaskLabel, User]), UsersModule],
  controllers: [TasksController],
  providers: [TasksService]
})
export class TasksModule {}
