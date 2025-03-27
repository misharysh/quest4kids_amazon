import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TaskStatus } from '../task.model';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { WrongTaskStatusException } from '../exceptions/wrong-task-status.exception';
import { Repository } from 'typeorm';
import { Task } from '../task.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTaskLabelDto } from '../dto/create-task-label.dto';
import { TaskLabel } from '../task-label.entity';
import { FindTaskParams } from '../dto/find-task.params';
import { PaginationParams } from '../../common/pagination.params';
import { CurrentUserDto } from 'src/users/dto/current-user.dto';
import { Role } from 'src/users/role.enum';
import { User } from 'src/users/user.entity';
import { TaskStatisticsItem, TaskStatisticsResponse } from '../dto/task-statistics.response';
import { TaskStatisticsParams } from '../dto/task-statistics.params';
import { UserTaskCompletion } from '../../users/user-task-completion.entity';

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
    ) {};

    public async findAll(filters: FindTaskParams, pagination: PaginationParams, currentUser: CurrentUserDto): Promise<[Task[], number]>
    {
        //solution #1
        const query = this.tasksRepository.createQueryBuilder('task')
            .leftJoinAndSelect('task.labels', 'labels');

        const isParent = currentUser.role === Role.PARENT;
        
        if (isParent)
        {
            //get all tasks from all children related to Parent Id
            var queryBuilder = query.subQuery()
                .select("user.id")
                .from(User, "user")
                .where("user.parentId = :parentId", {parentId: currentUser.id});    

            //filtered by concrete child
            if (filters.childId?.trim())
            {
                queryBuilder = queryBuilder
                    .andWhere("user.id = :childId", { childId: filters.childId });
            }

            const subQuery = queryBuilder.getQuery();
                
            query.andWhere(`task.userId IN ${subQuery}`);
        }
        else
        {
            //get tasks only for concrete child
            query.where('task.userId = :userId', { userId : currentUser.id });
        }

        if (filters.status)
        {
            query.andWhere('task.status = :status', {status: filters.status});
        }

        if (filters.search?.trim())
        {
            query.andWhere('(task.title ILIKE :search OR task.description ILIKE :search)', {search: `%${filters.search}%`});
        }

        if (filters.labels?.length)
        {
            const subQuery = query.subQuery()
            .select('labels.taskId')
            .from('task_label', 'labels')
            .where('labels.name IN (:...names)', {names: filters.labels})
            .getQuery();

            query.andWhere(`task.id IN ${subQuery}`);
        }

        query.orderBy(`task.${filters.sortBy}`, filters.sortOrder);

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
    };

    public async findOneOrFail(id: string): Promise<Task>
    {
        const task = await this.findOne(id);

        if (!task)
        {
            throw new NotFoundException();
            
        }
        
        return task;
    };

    public async findOne(id: string): Promise<Task | null>
    {
        return await this.tasksRepository.findOne({
            where: {id},
            relations: ['labels']
        });
    };

    public async getTaskStatistics(
        currentUser: CurrentUserDto,
        filters: TaskStatisticsParams
    ): Promise<TaskStatisticsResponse>
    {
        const isParent = currentUser.role === Role.PARENT;
                
        if (isParent)
        {
            //get all task statistics
            const query = this.usersRepository.createQueryBuilder('user')
            .leftJoinAndSelect('user.tasks', 'tasks')
            .where("user.parentId = :parentId", {parentId: currentUser.id});

            //filtered by concrete child
            if (filters.childId?.trim())
            {
                query.andWhere("user.id = :childId", { childId: filters.childId });
            }

            const users = await query.getMany();

            var taskStatisticsItems: TaskStatisticsItem[] = [];

            users.forEach((user: User) => {
                const taskStatistics = this.createTaskStatisticsItem(user.id, user.name, user.tasks);
                taskStatisticsItems.push(taskStatistics);
            });

            return {
                data: taskStatisticsItems
            };
        }
        else
        {
            //get task statistics for child
            const tasks = await this.tasksRepository.find({
                where: {
                    userId: currentUser.id
                },
            });

            const taskStatistics = this.createTaskStatisticsItem(currentUser.id, currentUser.name, tasks);

            return {
                data: [taskStatistics]
            };
        }
    };

    public async createTask(createTaskDto:CreateTaskDto, user: User): Promise<Task>
    {
        if (createTaskDto.labels)
        {
            createTaskDto.labels = this.getUniqueLabels(createTaskDto.labels);
        }

        const task = await this.tasksRepository.create(createTaskDto);

        await this.tasksRepository.save(task);

        if (createTaskDto.status === TaskStatus.DONE) //awards points in case of DONE
        {
            const points = createTaskDto.points ? createTaskDto.points : 0;

            user.availablePoints += points;
            user.totalEarnedPoints += points;

            await this.usersRepository.save(user);

            const userTaskCompletion = new UserTaskCompletion();
            userTaskCompletion.user = user;
            userTaskCompletion.task = task;
            userTaskCompletion.points = points;

            await this.userTaskCompletionsRepository.save(userTaskCompletion);
        }

        return task;
    };

    public async updateTask(task: Task, updateTaskDto: UpdateTaskDto): Promise<Task>
    {
        if (updateTaskDto.status)
        {
            if (!this.isValidStatusTransition(task.status, updateTaskDto.status))
            {
                throw new WrongTaskStatusException();
            }
            
            if (updateTaskDto.status === TaskStatus.DONE) //awards points in case of DONE
            {
                const user = await this.usersRepository.findOneBy({id: task.userId});
                
                if (user)
                {
                    const points = updateTaskDto.points 
                                    ? updateTaskDto.points 
                                    : task.points ? task.points : 0;

                    user.availablePoints += points;
                    user.totalEarnedPoints += points;
    
                    await this.usersRepository.save(user);

                    const userTaskCompletion = new UserTaskCompletion();
                    userTaskCompletion.user = user;
                    userTaskCompletion.task = task;
                    userTaskCompletion.points = points;

                    await this.userTaskCompletionsRepository.save(userTaskCompletion);
                }
            }
        }

        if (updateTaskDto.labels)
        {
            updateTaskDto.labels = this.getUniqueLabels(updateTaskDto.labels);
        }

        Object.assign(task, updateTaskDto);

        return await this.tasksRepository.save(task);
    };

    public async deleteTask(task: Task): Promise<void>
    {
        await this.tasksRepository.remove(task);
    };

    public async addLabels(task: Task, labelsDto: CreateTaskLabelDto[]): Promise<Task>
    {
        const names = new Set(task.labels.map((label) => label.name));

        const labels =this.getUniqueLabels(labelsDto)
            .filter(dto => !names.has(dto.name))
            .map((label) => this.labelsRepository.create(label));

        if (labels.length)
        {
            task.labels = [...task.labels, ...labels];

            return await this.tasksRepository.save(task);
        }
        
        return task;
    };

    public async removeLabels(task: Task, labelsToRemove: string[]): Promise<Task>
    {
        task.labels = task.labels.filter((label) => !labelsToRemove.includes(label.name));

        return await this.tasksRepository.save(task);
    };

    public async checkTaskOwnership(task: Task, currentUser: CurrentUserDto): Promise<void>
    {
        const isParent = currentUser.role === Role.PARENT;

        if (isParent)
        {
            const parentId = currentUser.id;
            const query = this.usersRepository.createQueryBuilder('user')
                .where('user.parentId = :parentId', {parentId});
            
            const items = await query.getMany();

            if (!items.some((user) => user.id === task.userId))
            {
                throw new ForbiddenException('You can only access tasks of you children');
            }
        }
        else
        {
            if (task.userId !== currentUser.id)
            {
                throw new ForbiddenException('You can only access your tasks');
            }
        }
    };

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
    };

    private getUniqueLabels(labelsDtos: CreateTaskLabelDto[]): CreateTaskLabelDto[]
    {
        const uniqueNames = [...new Set(labelsDtos.map((label) => label.name))];

        return uniqueNames.map((name) => ({name}));
    };

    private createTaskStatisticsItem(id: string, name: string, tasks: Task[]) : TaskStatisticsItem
    {
        const taskStatistics = new TaskStatisticsItem();
        taskStatistics.id = id;
        taskStatistics.name = name;
        taskStatistics.openTasks = tasks.filter((task) => task.status === TaskStatus.OPEN).length;
        taskStatistics.inProgressTasks = tasks.filter((task) => task.status === TaskStatus.IN_PROGRESS).length;
        taskStatistics.doneTasks = tasks.filter((task) => task.status === TaskStatus.DONE).length;

        return taskStatistics;
    };
}
