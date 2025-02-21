import { Injectable } from '@nestjs/common';
import { TaskStatus } from './task.model';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { WrongTaskStatusException } from './exceptions/wrong-task-status.exception';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TasksService {

    constructor(
        @InjectRepository(Task)
        private tasksRepository: Repository<Task>
    ) {};

    public async findAll(): Promise<Task[]>
    {
        return await this.tasksRepository.find();
    };

    public async findOne(id: string): Promise<Task | null>
    {
        return await this.tasksRepository.findOneBy({id});
    };

    public async createTask(createTaskDto:CreateTaskDto): Promise<Task>
    {
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

        Object.assign(task, updateTaskDto);

        return await this.tasksRepository.save(task);
    };

    public async deleteTask(task: Task): Promise<void>
    {
        await this.tasksRepository.delete(task);
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
}
