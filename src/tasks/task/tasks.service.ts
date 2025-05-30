import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TaskStatus } from '../task.model';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { WrongTaskStatusException } from '../exceptions/wrong-task-status.exception';
import { Repository } from 'typeorm';
import { Task } from '../task.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { TaskLabel } from '../task-label.entity';
import { FindTaskParams } from '../dto/find-task.params';
import { PaginationParams } from '../../common/pagination.params';
import { CurrentUserDto } from 'src/users/dto/current-user.dto';
import { Role } from 'src/users/role.enum';
import { User } from 'src/users/user.entity';
import { TaskStatisticsItem } from '../dto/task-statistics.response';
import { TaskStatisticsParams } from '../dto/task-statistics.params';
import { UserTaskCompletion } from '../../users/user-task-completion.entity';
import { TaskLabelEnum } from '../task-label.enum';
import { Badge } from 'src/badges/badge.entity';
import { UserBadge } from 'src/badges/user-badge.entity';
import { NotificationService } from 'src/notifications/notification.service';
import { Response } from 'express';
import * as csv from 'csv-parse';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TaskCommentsEntity } from '../entities/task-comments.entity';
import { TaskStatusLoggerService } from '../task-status-log/task-status-logger.service';
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

    @InjectRepository(UserTaskCompletion)
    private userTaskCompletionsRepository: Repository<UserTaskCompletion>,

    @InjectRepository(Badge)
    private badgeRepository: Repository<Badge>,

    @InjectRepository(UserBadge)
    private userBadgeRepository: Repository<UserBadge>,

    @InjectRepository(TaskCommentsEntity)
    private taskCommentsRepository: Repository<TaskCommentsEntity>,

    private readonly statusLogger: TaskStatusLoggerService,

    private readonly notificationService: NotificationService,

    @Inject('COMMUNICATION') private readonly microserviceClient: ClientProxy,
  ) {}

  public async findAll(
    filters: FindTaskParams,
    pagination: PaginationParams,
    currentUser: CurrentUserDto,
  ): Promise<[Task[], number]> {
    //solution #1
    const query = this.tasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.labels', 'labels');

    const isParent = currentUser.role === Role.PARENT;

    if (isParent) {
      //get all tasks from all children related to Parent Id
      let queryBuilder = query
        .subQuery()
        .select('user.id')
        .from(User, 'user')
        .where('user.parentId = :parentId', { parentId: currentUser.id });

      //filtered by concrete child
      if (filters.childId?.trim()) {
        queryBuilder = queryBuilder.andWhere('user.id = :childId', {
          childId: filters.childId,
        });
      }

      const subQuery = queryBuilder.getQuery();

      query.andWhere(`task.userId IN ${subQuery}`);
    } else {
      //get tasks only for concrete child
      query.where('task.userId = :userId', { userId: currentUser.id });
    }

    if (filters.status) {
      query.andWhere('task.status = :status', { status: filters.status });
    }

    if (filters.search?.trim()) {
      query.andWhere(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.labels?.length) {
      const subQuery = query
        .subQuery()
        .select('labels.taskId')
        .from('task_label', 'labels')
        .where('labels.name IN (:...names)', { names: filters.labels })
        .getQuery();

      query.andWhere(`task.id IN ${subQuery}`);
    }

    const sortOrder =
      filters.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query.orderBy(`task.${filters.sortBy}`, sortOrder);

    query.skip(pagination.offset).take(pagination.limit);

    return query.getManyAndCount();

    //solution #2
    // const where: FindOptionsWhere<Task> = {};

    // if (filters.status)
    // {
    //     where.status = filters.status;
    // }

    // if (filters.search?.trim())
    // {
    //     where.title = Like(`%${filters.search}%`);
    //     where.description = Like(`%${filters.search}%`);
    // }

    // return await this.tasksRepository.findAndCount({
    //     where,
    //     relations: ['labels'],
    //     skip: pagination.offset,
    //     take: pagination.limit
    // });
  }

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

    try
    {
      const result = await firstValueFrom(
      this.microserviceClient.send<Buffer>('generate_pdf', { title, content }),
      );
      
      const pdfBuffer = Buffer.isBuffer(result)
      ? result
      : Buffer.from((result as any).data);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename=tasks.pdf');
      res.end(pdfBuffer);
    }
    catch (err) {
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

  public async createTask(
    createTaskDto: CreateTaskDto,
    user: User,
  ): Promise<Task> {
    const { labels, ...taskData } = createTaskDto;
    const comment = createTaskDto.comment;
    const task = await this.tasksRepository.create(taskData);

    await this.tasksRepository.save(task);

    let newLabels: TaskLabel[] = [];

    if (labels && labels.length > 0) {
      const uniqueLabels = this.getUniqueLabels(labels);

      newLabels = uniqueLabels.map((label) =>
        this.labelsRepository.create({
          name: label,
          task: task,
        }),
      );

      await this.labelsRepository.save(newLabels);
    }

    await this.createTaskComment(user, task, comment);

    if (taskData.status === TaskStatus.DONE) {
      //awards points in case of DONE
      const points = taskData.points ? taskData.points : 0;

      user.availablePoints += points;
      user.totalEarnedPoints += points;

      await this.usersRepository.save(user);

      const userTaskCompletion = new UserTaskCompletion();
      userTaskCompletion.user = user;
      userTaskCompletion.task = task;
      userTaskCompletion.points = points;

      await this.userTaskCompletionsRepository.save(userTaskCompletion);

      await this.setReward(newLabels, user.id);
    }

    return task;
  }

  public async updateTask(
    task: Task,
    updateTaskDto: UpdateTaskDto,
  ): Promise<Task> {
    const { labels, ...taskData } = updateTaskDto;
    const comment = updateTaskDto.comment as string;

    if (labels && labels.length > 0) {
      const uniqueLabels = this.getUniqueLabels(labels).map((label) =>
        this.labelsRepository.create({ name: label }),
      );

      task.labels = uniqueLabels;
      task.updatedAt = new Date();
    }

    const userForComment = await this.usersRepository.findOneBy({
      id: task.userId,
    });
    await this.createTaskComment(userForComment, task, comment);

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

      if (taskData.status === TaskStatus.DONE) {
        //awards points in case of DONE

        if (user) {
          const points = taskData.points
            ? taskData.points
            : task.points
              ? task.points
              : 0;

          user.availablePoints += points;
          user.totalEarnedPoints += points;

          await this.usersRepository.save(user);

          const userTaskCompletion = new UserTaskCompletion();
          userTaskCompletion.user = user;
          userTaskCompletion.task = task;
          userTaskCompletion.points = points;

          await this.userTaskCompletionsRepository.save(userTaskCompletion);

          await this.setReward(task.labels, user.id);

          //send notification to Parent
          if (user.role === Role.CHILD && user.parentId) {
            const message = `${user.name} changed status of task: ${task.title} -> ${taskData.status}`;
            await this.notificationService.createForUser(
              user.parentId,
              message,
            );
          }
        }
      }
    }

    Object.assign(task, taskData);
    await this.tasksRepository.save(task);
    task.actualTime = await this.statusLogger.getTaskTime(task.id);

    return await this.tasksRepository.save(task);
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

  public async validateCsvData(
    file: Express.Multer.File,
    currentUser: CurrentUserDto,
  ): Promise<any> {
    const csvContent = file.buffer;

    const parsedData: any = await new Promise((resolve, reject) => {
      csv.parse(
        csvContent,
        {
          columns: true,
          relax_quotes: true,
          skip_empty_lines: true,
          cast: true,
        },
        (err, records) => {
          if (err) {
            reject(err);

            return { error: true, message: 'Unable to parse file' };
          }

          resolve(records);
        },
      );
    });

    const errors: string[] = [];
    const validDtos: { csvDto: CreateTaskDto; childUser: User | null }[] = [];

    if (!parsedData.length) {
      errors.push('Empty file Provided');

      return {
        error: true,
        message: 'File Validation Failed',
        errorsArray: errors,
      };
    }

    //validate rows
    for await (const [index, rowData] of parsedData.entries()) {
      const validationErrors = await this.validateFileRow(
        rowData,
        currentUser,
        validDtos,
      );

      if (validationErrors.length) {
        return {
          error: true,
          message: `File Rows Validation Failed at row ${index + 1}`,
          errorsArray: validationErrors,
        };
      }
    }

    return { error: false, validData: validDtos };
  }

  private async validateFileRow(
    rowData: any,
    currentUser: CurrentUserDto,
    validDtos: { csvDto: CreateTaskDto; childUser: User | null }[],
  ) {
    const errors: string[] = [];

    const csvDto = plainToInstance(CreateTaskDto, rowData);

    const validationErrors = await validate(csvDto);

    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => {
        const { property, constraints } = error;
        if (constraints) {
          const errorMessage = `${property}: ${Object.values(constraints).join(', ')}`;
          errors.push(errorMessage);
        } else {
          errors.push(`${property}: validation error`);
        }
      });
    }

    let childUser: User | null = null;

    if (csvDto.userId !== undefined) {
      childUser = await this.usersRepository.findOneBy({ id: csvDto.userId });

      if (!childUser) {
        errors.push('Child user not found');
      }

      //check if this childUser has ParentId as current user id
      if (childUser?.parentId !== currentUser.id) {
        errors.push('You can only access your children');
      }
    }

    if (errors.length === 0) {
      validDtos.push({ csvDto, childUser });
    }

    return errors;
  }

  private async setReward(labels: TaskLabel[], userId: string): Promise<void> {
    if (labels.length > 0) {
      for (const label of labels) {
        const { total } = await this.userTaskCompletionsRepository
          .createQueryBuilder('completion')
          .leftJoin('completion.task', 'task')
          .leftJoin('task.labels', 'label')
          .where('completion.userId = :userId', { userId: userId })
          .andWhere('label.name = :labelName', { labelName: label.name })
          .select('COALESCE(SUM(completion.points), 0)', 'total')
          .getRawOne();

        console.log(total + ' ' + label.name);

        const badge = await this.badgeRepository.findOne({
          where: { label: label.name },
        });

        if (badge && total >= badge.requiredPoints) {
          const existingUserBadge = await this.userBadgeRepository.findOne({
            where: { user: { id: userId }, badge: { id: badge.id } },
          });

          if (!existingUserBadge) {
            await this.userBadgeRepository.save({
              user: { id: userId },
              badge,
            });
          }
        }
      }
    }
  }

  private isValidStatusTransition(
    currentStatus: TaskStatus,
    newStatus: TaskStatus,
  ): boolean {
    const statusOrder = [
      TaskStatus.OPEN,
      TaskStatus.IN_PROGRESS,
      TaskStatus.DONE,
    ];
    return statusOrder.indexOf(currentStatus) < statusOrder.indexOf(newStatus);
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

  private async createTaskComment(
    user: User | null,
    task: Task,
    comment: string,
  ): Promise<void> {
    if (comment && comment.trim().length > 0 && user) {
      const taskComment = this.taskCommentsRepository.create({
        task: task,
        comment: comment.trim(),
        user: user,
      });

      await this.taskCommentsRepository.save(taskComment);
    }
  }
}
