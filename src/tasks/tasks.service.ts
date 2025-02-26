import { Injectable } from '@nestjs/common';
import { TaskStatus } from './task.model';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { WrongTaskStatusException } from './exceptions/wrong-task-status.exception';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTaskLabelDto } from './dto/create-task-label.dto';
import { TaskLabel } from './task-label.entity';
import { FindTaskParams } from './find-task.params';
import { PaginationParams } from 'src/common/pagination.params';

@Injectable()
export class TasksService {

    constructor(
        @InjectRepository(Task)
        private tasksRepository: Repository<Task>,

        @InjectRepository(TaskLabel)
        private labelsRepository: Repository<TaskLabel>
    ) {};

    public async findAll(filters: FindTaskParams, pagination: PaginationParams): Promise<[Task[], number]>
    {
        //solution #1
        const query = this.tasksRepository.createQueryBuilder('task')
            .leftJoinAndSelect('task.labels', 'labels');

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

    public async findOne(id: string): Promise<Task | null>
    {
        return await this.tasksRepository.findOne({
            where: {id},
            relations: ['labels']
        });
    };

    public async createTask(createTaskDto:CreateTaskDto): Promise<Task>
    {
        if (createTaskDto.labels)
        {
            createTaskDto.labels = this.getUniqueLabels(createTaskDto.labels);
        }

        const task = await this.tasksRepository.create(createTaskDto);

        await this.tasksRepository.save(task);

        return task;
    };

    public async updateTask(task: Task, updateTaskDto: UpdateTaskDto): Promise<Task>
    {
        if (updateTaskDto.status && !this.isValidStatusTransition(task.status, updateTaskDto.status))
        {
            throw new WrongTaskStatusException();
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

    private isValidStatusTransition(
        currentStatus: TaskStatus,
        newStatus: TaskStatus,
      ): boolean {
        const statusOrder = [
          TaskStatus.OPEN,
          TaskStatus.IN_PROGRESS,
          TaskStatus.DONE,
        ];
        return statusOrder.indexOf(currentStatus) <= statusOrder.indexOf(newStatus);
    };

    private getUniqueLabels(labelsDtos: CreateTaskLabelDto[]): CreateTaskLabelDto[]
    {
        const uniqueNames = [...new Set(labelsDtos.map((label) => label.name))];

        return uniqueNames.map((name) => ({name}));
    }
}
