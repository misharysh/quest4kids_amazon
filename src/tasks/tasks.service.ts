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

@Injectable()
export class TasksService {

    constructor(
        @InjectRepository(Task)
        private tasksRepository: Repository<Task>,

        @InjectRepository(TaskLabel)
        private labelsRepository: Repository<TaskLabel>
    ) {};

    public async findAll(): Promise<Task[]>
    {
        return await this.tasksRepository.find();
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
