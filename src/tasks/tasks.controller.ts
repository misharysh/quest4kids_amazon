import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { FindOneParams } from './find-one.params';
import { UpdateTaskDto } from './dto/update-task.dto';
import { WrongTaskStatusException } from './exceptions/wrong-task-status.exception';
import { Task } from './task.entity';

@Controller('tasks')
export class TasksController {

    constructor(private readonly tasksService: TasksService) {};

    @Get()
    public async findAll(): Promise<Task[]>
    {
        return await this.tasksService.findAll();
    };

    @Get('/:id')
    public async findOne(@Param() params: FindOneParams): Promise<Task>
    {
        return await this.findOneOrFail(params.id);
    };

    @Post()
    public async create(@Body() createTaskDto: CreateTaskDto): Promise<Task>
    {
        return await this.tasksService.createTask(createTaskDto);
    };

    @Patch('/:id')
    public async updateTask(
        @Param() params: FindOneParams,
        @Body() updateTaskDto: UpdateTaskDto): Promise<Task>
    {
        const task = await this.findOneOrFail(params.id);

        try
        {
            return await this.tasksService.updateTask(task, updateTaskDto);
        }
        catch(error)
        {
            if (error instanceof WrongTaskStatusException) {
                throw new BadRequestException([error.message]);
            }
            throw error;
        }
    };

    @Delete('/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    public async delete(@Param() params: FindOneParams): Promise<void>
    {
        const task = await this.findOneOrFail(params.id);
        await this.tasksService.deleteTask(task);
    };

    private async findOneOrFail(id: string): Promise<Task>
    {
        const task = await this.tasksService.findOne(id);

        if (!task)
        {
            throw new NotFoundException();
            
        }

        return task;
    };
}
