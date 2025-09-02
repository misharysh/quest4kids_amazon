import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TaskStatus } from '../task.model';
import { Repository } from 'typeorm';
import { Task } from '../task.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { TaskLabel } from '../task-label.entity';
import { CurrentUserDto } from '../../users/dto/current-user.dto';
import { Role } from '../../users/role.enum';
import { User } from '../../users/user.entity';
import { TaskStatisticsItem } from '../dto/task-statistics.response';
import { TaskStatisticsParams } from '../dto/task-statistics.params';
import { TaskLabelEnum } from '../task-label.enum';
import { Response } from 'express';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,

    @InjectRepository(TaskLabel)
    private labelsRepository: Repository<TaskLabel>,

    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @Inject('COMMUNICATION') private readonly microserviceClient: ClientProxy,
  ) {}

  public async findOneOrFail(id: string): Promise<Task> {
    const task = await this.findOne(id);

    if (!task) {
      throw new NotFoundException();
    }

    return task;
  }

  public async findOne(id: string): Promise<Task | null> {
    return await this.tasksRepository.findOne({
      where: { id },
      relations: ['labels'],
    });
  }

  public async pingMicroserviceTest(): Promise<string> {
    const result = await firstValueFrom(
      this.microserviceClient.send<string>('ping', {}),
    );

    return result;
  }

  public async generateTaskStatisticsPdf(
    items: TaskStatisticsItem[],
    res: Response,
  ) {
    const title = 'Tasks Statistics';

    const contentLines: string[] = [];
    items.forEach((item: TaskStatisticsItem) => {
      contentLines.push(`User: ${item.name}`);
      contentLines.push(`Open Tasks: ${item.openTasks}`);
      contentLines.push(`In Progress Tasks: ${item.inProgressTasks}`);
      contentLines.push(`Done Tasks: ${item.doneTasks}`);
      contentLines.push(`-----------------------------`);
    });

    const content = contentLines.join('\n');

    try {
      const result = await firstValueFrom(
        this.microserviceClient.send<Buffer>('generate_pdf', {
          title,
          content,
        }),
      );

      const pdfBuffer = Buffer.isBuffer(result)
        ? result
        : Buffer.from((result as any).data);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename=tasks.pdf');
      res.end(pdfBuffer);
    } catch (err) {
      console.error('Error when calling microservice:', err);
    }
  }

  public async getTaskStatistics(
    currentUser: CurrentUserDto,
    filters: TaskStatisticsParams,
  ): Promise<TaskStatisticsItem[]> {
    const isParent = currentUser.role === Role.PARENT;

    if (isParent) {
      //get all task statistics
      const query = this.usersRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.tasks', 'tasks')
        .where('user.parentId = :parentId', { parentId: currentUser.id });

      //filtered by concrete child
      if (filters.childId?.trim()) {
        query.andWhere('user.id = :childId', { childId: filters.childId });
      }

      const users = await query.getMany();

      const taskStatisticsItems: TaskStatisticsItem[] = [];

      users.forEach((user: User) => {
        const taskStatistics = this.createTaskStatisticsItem(
          user.id,
          user.name,
          user.tasks,
        );
        taskStatisticsItems.push(taskStatistics);
      });

      return taskStatisticsItems;
    } else {
      //get task statistics for child
      const tasks = await this.tasksRepository.find({
        where: {
          userId: currentUser.id,
        },
      });

      const taskStatistics = this.createTaskStatisticsItem(
        currentUser.id,
        currentUser.name,
        tasks,
      );

      return [taskStatistics];
    }
  }

  public async deleteTask(task: Task): Promise<void> {
    await this.tasksRepository.remove(task);
  }

  public async addLabels(
    task: Task,
    labelsDto: TaskLabelEnum[],
  ): Promise<Task> {
    const names = new Set(task.labels.map((label) => label.name));

    const labels = this.getUniqueLabels(labelsDto)
      .filter((dto) => !names.has(dto))
      .map((label) => this.labelsRepository.create({ name: label }));

    if (labels.length) {
      task.labels = [...task.labels, ...labels];

      return await this.tasksRepository.save(task);
    }

    return task;
  }

  public async removeLabels(
    task: Task,
    labelsToRemove: TaskLabelEnum[],
  ): Promise<Task> {
    task.labels = task.labels.filter(
      (label) => !labelsToRemove.includes(label.name),
    );

    return await this.tasksRepository.save(task);
  }

  public async checkTaskOwnership(
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

  private getUniqueLabels(labelsDtos: TaskLabelEnum[]): TaskLabelEnum[] {
    return [...new Set(labelsDtos)];
  }

  private createTaskStatisticsItem(
    id: string,
    name: string,
    tasks: Task[],
  ): TaskStatisticsItem {
    const taskStatistics = new TaskStatisticsItem();
    taskStatistics.id = id;
    taskStatistics.name = name;
    taskStatistics.openTasks = tasks.filter(
      (task) => task.status === TaskStatus.OPEN,
    ).length;
    taskStatistics.inProgressTasks = tasks.filter(
      (task) => task.status === TaskStatus.IN_PROGRESS,
    ).length;
    taskStatistics.doneTasks = tasks.filter(
      (task) => task.status === TaskStatus.DONE,
    ).length;

    return taskStatistics;
  }
}
