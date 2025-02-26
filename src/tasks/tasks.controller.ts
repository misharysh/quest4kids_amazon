import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { FindOneParams } from './find-one.params';
import { UpdateTaskDto } from './dto/update-task.dto';
import { WrongTaskStatusException } from './exceptions/wrong-task-status.exception';
import { Task } from './task.entity';
import { CreateTaskLabelDto } from './dto/create-task-label.dto';
import { FindTaskParams } from './find-task.params';
import { PaginationParams } from 'src/common/pagination.params';
import { PaginationResponse } from 'src/common/pagination.response';

@Controller('tasks')
export class TasksController {

    constructor(private readonly tasksService: TasksService) {};

    @Get()
    public async findAll(
        @Query() filters: FindTaskParams,
        @Query() pagination: PaginationParams
    ): Promise<PaginationResponse<Task>>
    {
        const [items, total] = await this.tasksService.findAll(filters, pagination);

        return {
            data: items,
            meta: {
                total,
                offset: pagination.offset,
                limit: pagination.limit
            }
        }
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

    @Post(':id/labels')
    async addLabels(
        @Param() { id }: FindOneParams,
        @Body() createTaskLabelDto: CreateTaskLabelDto[]): Promise<Task> 
    {
        const task = await this.findOneOrFail(id);

        return await this.tasksService.addLabels(task, createTaskLabelDto);
    };

    @Delete(':id/labels')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeLabels(
        @Param() { id }: FindOneParams,
        @Body() labelsNames: string[]): Promise<void>
    {
        const task = await this.findOneOrFail(id);

        await this.tasksService.removeLabels(task, labelsNames);
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
