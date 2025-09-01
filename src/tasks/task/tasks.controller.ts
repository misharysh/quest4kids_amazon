import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
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
import { Roles } from '../../users/decorators/roles.decorator';
import { Role } from '../../users/role.enum';
import { UserService } from '../../users/user/user.service';
import { CurrentUserDto } from '../../users/dto/current-user.dto';
import { TaskStatisticsParams } from '../dto/task-statistics.params';
import { TaskStatisticsResponse } from '../dto/task-statistics.response';
import { Response } from 'express';
import { ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { GenerateTaskDto } from '../dto/generate-task.dto';
import { TasksCacheInterceptor } from 'src/interceptors/tasks-cache.interceptors';
import { GetTaskListQuery } from '../cqrs/queries/get-task-list.query';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateTaskCommand } from '../cqrs/commands/create-task.command';
import { GenerateTaskCommand } from '../cqrs/commands/generate-task.command';
import { UpdateTaskCommand } from '../cqrs/commands/update-task.command';
import { CreateTasksFromCsvCommand } from '../cqrs/commands/create-tasks-from-csv.command';
import { GetChildAccountQuery } from 'src/users/cqrs/queries/get-child-account.query';

@Controller()
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly userService: UserService,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('tasks')
  public async findAll(
    @Query() filters: FindTaskParams,
    @Query() pagination: PaginationParams,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<PaginationResponse<Task>> {
    const query = new GetTaskListQuery(filters, pagination, currentUser);
    const [items, total] = await this.queryBus.execute<GetTaskListQuery,[Task[], number]>(query);

    return {
      data: items,
      meta: {
        total,
        offset: pagination.offset,
        limit: pagination.limit,
      },
    };
  }

  @UseInterceptors(TasksCacheInterceptor)
  @Get('tasks-with-cache')
  public async findAllCached(
    @Query() filters: FindTaskParams,
    @Query() pagination: PaginationParams,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<PaginationResponse<Task>> {
    const query = new GetTaskListQuery(filters, pagination, currentUser);
    const [items, total] = await this.queryBus.execute<GetTaskListQuery,[Task[], number]>(query);

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
    const taskStatisticsItems = await this.tasksService.getTaskStatistics(
      currentUser,
      filters,
    );

    return {
      data: taskStatisticsItems,
    };
  }

  @Get('tasks/statistics-report')
  public async taskStatisticsReport(
    @CurrentUser() currentUser: CurrentUserDto,
    @Res() res: Response,
  ) {
    const filters = new TaskStatisticsParams();
    const taskStatisticsItems = await this.tasksService.getTaskStatistics(
      currentUser,
      filters,
    );

    await this.tasksService.generateTaskStatisticsPdf(taskStatisticsItems, res);
  }

  @Get('tasks/ping-microservice')
  public async pingMicroservice() {
    return await this.tasksService.pingMicroserviceTest();
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

  @Post('tasks/generate')
  public async generateTask(@Body() dto: GenerateTaskDto) {
    return this.commandBus.execute(new GenerateTaskCommand(dto));
  }

  @Post('kids/:id/task')
  @Roles(Role.PARENT)
  public async create(
    @Param('id') id: string,
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<Task> {
    const childUser = await this.queryBus.execute(
      new GetChildAccountQuery({id}, currentUser),
    );

    return this.commandBus.execute(
      new CreateTaskCommand({ ...createTaskDto, userId: id }, childUser),
    );
  }

  @ApiOperation({ summary: 'Upload CSV file enpdoint' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @Post('kids/upload-file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { files: 1, fileSize: 1024 * 1024 * 50 }, //10mb
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = ['text/csv'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          callback(new BadRequestException('Invalid file type'), false);
        } else if (file?.size > 1024 * 1024 * 50) {
          callback(
            new BadRequestException('Max File Size Reached. Max Allowed 10MB'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  public async uploadCsvFile(
    @CurrentUser() currentUser: CurrentUserDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const response = await this.commandBus.execute(
      new CreateTasksFromCsvCommand(file, currentUser),
    );

    return {
      error: response?.error || false,
      statusCode:  response?.statusCode || (response?.error ? HttpStatus.BAD_REQUEST : HttpStatus.OK),
      message: response?.message || (response?.error ? 'File Upload Failed' : 'File Uploaded successfully'),
      data: response?.validData || [],
      errorsArray: response?.errorsArray || [],
    };
  }

  @Patch('tasks/:id')
  public async updateTask(
    @Param() params: FindOneParams,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<Task> {
    try {
      return await this.commandBus.execute(
        new UpdateTaskCommand(params.id, updateTaskDto, currentUser),
      );
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
