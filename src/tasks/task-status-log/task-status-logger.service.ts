import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TaskStatusLogsEntity } from '../entities/task-status-logs.entity';
import { Repository } from 'typeorm';
import { User } from '../../users/user.entity';
import { Task } from '../task.entity';
import { TaskStatus } from '../task.model';

@Injectable()
export class TaskStatusLoggerService {
  constructor(
    @InjectRepository(TaskStatusLogsEntity)
    private taskStatusLogsRepository: Repository<TaskStatusLogsEntity>,
  ) {}

  async createStatusLog(
    user: User | null,
    task: Task,
    newStatus: TaskStatus,
    prevStatus: TaskStatus,
  ): Promise<void> {
    if (user) {
      const log = this.taskStatusLogsRepository.create({
        task: task,
        user: user,
        new_status: newStatus,
        prev_status: prevStatus,
      });

      await this.taskStatusLogsRepository.save(log);
    }
  }

  async getTaskStatusHistory(taskId: string): Promise<TaskStatusLogsEntity[]> {
    return this.taskStatusLogsRepository.find({
      where: { task: { id: taskId } },
      relations: ['user'],
      order: { changedAt: 'DESC' },
    });
  }
}
