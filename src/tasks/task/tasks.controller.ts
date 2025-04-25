import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { FindOneParams } from '../dto/find-one.params';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { WrongTaskStatusException } from '../exceptions/wrong-task-status.exception';
import { Task } from '../task.entity';
import { TaskLabelDto } from '../dto/task-label.dto';
import { FindTaskParams } from '../dto/find-task.params';
import { PaginationParams } from '../../common/pagination.params';
import { PaginationResponse } from '../../common/pagination.response';
import { CurrentUser } from '../../users/decorators/current-user.decorator';
import { Roles } from 'src/users/decorators/roles.decorator';
import { Role } from 'src/users/role.enum';
import { UserService } from 'src/users/user/user.service';
import { CurrentUserDto } from 'src/users/dto/current-user.dto';
import { TaskStatisticsParams } from '../dto/task-statistics.params';
import { TaskStatisticsResponse } from '../dto/task-statistics.response';
import { Response } from 'express';

@Controller()
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly userService: UserService,
  ) {}

  @Get('tasks')
  public async findAll(
    @Query() filters: FindTaskParams,
    @Query() pagination: PaginationParams,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<PaginationResponse<Task>> {
    const [items, total] = await this.tasksService.findAll(
      filters,
      pagination,
      currentUser,
    );

    return {
      data: items,
      meta: {
        total,
        offset: pagination.offset,
        limit: pagination.limit,
      },
    };
  }

  @Get('tasks/statistics')
  public async taskStatistics(
    @Query() filters: TaskStatisticsParams,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<TaskStatisticsResponse> {
    const taskStatisticsItems = await this.tasksService.getTaskStatistics(currentUser, filters);
    
    return {
      data: taskStatisticsItems,
    };
  }

  @Get('tasks/statistics-report')
  public async taskStatisticsReport(
    @CurrentUser() currentUser: CurrentUserDto,
    @Res() res: Response
  ) {
    const filters = new TaskStatisticsParams();
    const taskStatisticsItems = await this.tasksService.getTaskStatistics(currentUser, filters);

    await this.tasksService.generateTaskStatisticsPdf(taskStatisticsItems, res);
  }

  @Get('tasks/:id')
  public async findOne(
    @Param() params: FindOneParams,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<Task> {
    const task = await this.tasksService.findOneOrFail(params.id);
    await this.tasksService.checkTaskOwnership(task, currentUser);
    return task;
  }

  @Post('kids/:id/task')
  @Roles(Role.PARENT)
  public async create(
    @Param('id') id: string,
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<Task> {
    //check if there is a child user
    const childUser = await this.userService.findOne(id);

    if (!childUser) {
      throw new NotFoundException('Child user not found');
    }

    //check if this childUser has ParentId as current user id
    if (childUser.parentId !== currentUser.id) {
      throw new ForbiddenException('You can only access your children');
    }

    return await this.tasksService.createTask(
      { ...createTaskDto, userId: id },
      childUser,
    );
  }

  @Patch('tasks/:id')
  public async updateTask(
    @Param() params: FindOneParams,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<Task> {
    const task = await this.tasksService.findOneOrFail(params.id);
    await this.tasksService.checkTaskOwnership(task, currentUser);

    try {
      return await this.tasksService.updateTask(task, updateTaskDto);
    } catch (error) {
      if (error instanceof WrongTaskStatusException) {
        throw new BadRequestException([error.message]);
      }
      throw error;
    }
  }

  @Delete('tasks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(
    @Param() params: FindOneParams,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<void> {
    const task = await this.tasksService.findOneOrFail(params.id);
    await this.tasksService.checkTaskOwnership(task, currentUser);
    await this.tasksService.deleteTask(task);
  }

  @Post('tasks/:id/labels')
  public async addLabels(
    @Param() { id }: FindOneParams,
    @Body() createTaskLabelDto: TaskLabelDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<Task> {
    const task = await this.tasksService.findOneOrFail(id);
    await this.tasksService.checkTaskOwnership(task, currentUser);
    return await this.tasksService.addLabels(task, createTaskLabelDto.labels);
  }

  @Delete('tasks/:id/labels')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async removeLabels(
    @Param() { id }: FindOneParams,
    @Body() createTaskLabelDto: TaskLabelDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<void> {
    const task = await this.tasksService.findOneOrFail(id);
    await this.tasksService.checkTaskOwnership(task, currentUser);
    await this.tasksService.removeLabels(task, createTaskLabelDto.labels);
  }
}
