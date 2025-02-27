import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, HttpCode, HttpStatus, NotFoundException, Param, Patch, Post, Query} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { FindOneParams } from './find-one.params';
import { UpdateTaskDto } from './dto/update-task.dto';
import { WrongTaskStatusException } from './exceptions/wrong-task-status.exception';
import { Task } from './task.entity';
import { CreateTaskLabelDto } from './dto/create-task-label.dto';
import { FindTaskParams } from './find-task.params';
import { PaginationParams } from './../common/pagination.params';
import { PaginationResponse } from './../common/pagination.response';
import { CurrentUserId } from './../users/decorators/current-user-id.decorator';
import { Roles } from 'src/users/decorators/roles.decorator';
import { Role } from 'src/users/role.enum';
import { UserService } from 'src/users/user/user.service';

@Controller()
export class TasksController {

    constructor(
        private readonly tasksService: TasksService,
        private readonly usersService: UserService) {};

    @Get('tasks')
    public async findAll(
        @Query() filters: FindTaskParams,
        @Query() pagination: PaginationParams,
        @CurrentUserId() userId: string,
    ): Promise<PaginationResponse<Task>>
    {
        const [items, total] = await this.tasksService.findAll(filters, pagination,userId);

        return {
            data: items,
            meta: {
                total,
                offset: pagination.offset,
                limit: pagination.limit
            }
        }
    };

    @Get('tasks/:id')
    public async findOne(
        @Param() params: FindOneParams,
        @CurrentUserId() userId: string,
    ): Promise<Task>
    {
        const task = await this.findOneOrFail(params.id);
        this.checkTaskOwnership(task, userId);
        return task;
    };

    @Post('kids/:id/task')
    @Roles(Role.PARENT)
    public async create(
        @Param('id') id: string,
        @Body() createTaskDto: CreateTaskDto,
        @CurrentUserId() userId: string,
    ): Promise<Task>
    {
        //check if there is a child user
        const childUser = await this.usersService.findOne(id);

        if (!childUser)
        {
            throw new NotFoundException('Child user not found');
        }

        //check if this childUser has ParentId as current user id
        if (childUser.parentId !== userId)
        {
            throw new ForbiddenException('You can only access your children');
        }

        return await this.tasksService.createTask({...createTaskDto, userId: id});
    };

    @Patch('tasks/:id')
    public async updateTask(
        @Param() params: FindOneParams,
        @Body() updateTaskDto: UpdateTaskDto,
        @CurrentUserId() userId: string,
    ): Promise<Task>
    {
        const task = await this.findOneOrFail(params.id);
        this.checkTaskOwnership(task, userId);

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

    @Delete('tasks/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    public async delete(
        @Param() params: FindOneParams,
        @CurrentUserId() userId: string,
    ): Promise<void>
    {
        const task = await this.findOneOrFail(params.id);
        this.checkTaskOwnership(task, userId);
        await this.tasksService.deleteTask(task);
    };

    @Post('tasks/:id/labels')
    async addLabels(
        @Param() { id }: FindOneParams,
        @Body() createTaskLabelDto: CreateTaskLabelDto[],
        @CurrentUserId() userId: string,
    ): Promise<Task> 
    {
        const task = await this.findOneOrFail(id);
        this.checkTaskOwnership(task, userId);
        return await this.tasksService.addLabels(task, createTaskLabelDto);
    };

    @Delete('tasks/:id/labels')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeLabels(
        @Param() { id }: FindOneParams,
        @Body() labelsNames: string[],
        @CurrentUserId() userId: string,
    ): Promise<void>
    {
        const task = await this.findOneOrFail(id);
        this.checkTaskOwnership(task, userId);
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

    private checkTaskOwnership(task: Task, userId: string): void
    {
        if (task.userId !== userId)
        {
            throw new ForbiddenException('You can only access your tasks');
        }
    };
}
