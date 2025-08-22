import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../role.enum';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../user.entity';
import { UserService } from './user.service';
import { CurrentUser } from '../decorators/current-user.decorator';
import { PaginationResponse } from '../../common/pagination.response';
import { PaginationParams } from '../../common/pagination.params';
import { CurrentUserDto } from '../dto/current-user.dto';
import { FindOneParams } from '../../tasks/dto/find-one.params';
import { UpdateUserDto } from '../dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { PointsDto } from '../dto/points.dto';
import { UserWithOnlineStatusDto } from '../dto/user-with-online-status.dto';
import { OnlineService } from '../online/online.service';
import { UpdateTelegramChatIdDto } from '../dto/update-telegram-chat-id.dto';
import { LoggingFactory } from 'src/logging/logging.factory';
import { LogLevel } from 'src/logging/log-level.enum';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetChildAccountQuery } from '../cqrs/queries/get-child-account.query';
import { CreateChildAccountCommand } from '../cqrs/commands/create-child-account.command';
import { UpdateChildAccountCommand } from '../cqrs/commands/update-child-account.command';
import { populate } from './mappers/user-mapper';
import { GetChildrenListQuery } from '../cqrs/queries/get-children-list.query';

@Controller('user')
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly onlineService: OnlineService,
    private readonly loggingFactory: LoggingFactory,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('get-child-account/:id')
  @Roles(Role.PARENT)
  public async getChild(
    @Param() params: FindOneParams,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<User> {
    const logger = this.loggingFactory.create(UserController.name, 'console');
    logger.scope({ correlationId: '888' });
    logger.log(LogLevel.info, 'Fetching user', {});

    const query = new GetChildAccountQuery(params, currentUser);
    const user: Promise<User> = this.queryBus.execute(query);
    return user;
  }

  @Get('get-children-list')
  @Roles(Role.PARENT)
  public async getChildrenList(
    @Query() pagination: PaginationParams,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<PaginationResponse<User>> {
    const logger = this.loggingFactory.create(UserController.name, 'console');
    logger.scope({ correlationId: '123', traceId: 'abc' });

    const query = new GetChildrenListQuery(pagination, currentUser);
    const [items, total] = await this.queryBus.execute<
      GetChildrenListQuery,
      [User[], number]
    >(query);

    return {
      data: items,
      meta: {
        total,
        offset: pagination.offset,
        limit: pagination.limit,
      },
    };
  }

  @Get('get-online-users')
  public async getOnlineUsers(
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<UserWithOnlineStatusDto[]> {
    const isParent = currentUser.role === Role.PARENT;

    let usersWithOnlineStatus: User[] = [];

    if (isParent) {
      const pagination = new PaginationParams();
      const [items, total] = await this.userService.findAll(
        pagination,
        currentUser.id,
      );

      usersWithOnlineStatus = items;
    } else {
      const parentUser = await this.userService.findParentByChildId(
        currentUser.id,
      );
      if (parentUser) {
        usersWithOnlineStatus.push(parentUser);
      }
    }

    return usersWithOnlineStatus.map((user) => ({
      ...user,
      isOnline: this.onlineService.isUserOnline(user.id),
    }));
  }

  @Post('create-child-account')
  @Roles(Role.PARENT)
  public async createChildAccount(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<User> {
    return this.commandBus.execute(
      new CreateChildAccountCommand(createUserDto, currentUser.id),
    );
  }

  @Patch('update-child-account/:id')
  @Roles(Role.PARENT)
  public async updateChild(
    @Param() params: FindOneParams,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<User> {
    const command = new UpdateChildAccountCommand(
      params.id,
      currentUser,
      (user) => populate(user, updateUserDto),
    );
    return this.commandBus.execute(command);
  }

  @Delete('remove-child-account/:id')
  @Roles(Role.PARENT)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async deleteChild(
    @Param() params: FindOneParams,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<void> {
    const childUser = await this.userService.findOneOrFail(params.id);

    await this.userService.checkParentUser(childUser, currentUser);

    await this.userService.deleteUser(childUser);
  }

  @Post(':id/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, callback) => {
        return file.mimetype.match(/image\/(jpg|jpeg|png|gif)$/)
          ? callback(null, true)
          : callback(
              new BadRequestException('Only image files are allowed'),
              false,
            );
      },
    }),
  )
  public async addAvatar(
    @Param() params: FindOneParams,
    @CurrentUser() currentUser: CurrentUserDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<User> {
    const user = await this.userService.checkAvatarOwnership(
      params.id,
      currentUser,
    );

    return this.userService.addAvatar(user, file);
  }

  @Get(':id/avatar')
  public async getAvatar(
    @Param() params: FindOneParams,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<string> {
    const user = await this.userService.checkAvatarOwnership(
      params.id,
      currentUser,
    );

    if (!user.avatarName) {
      return '';
    }

    const url = await this.userService.getAvatar(user.avatarName);

    return url;
  }

  @Post(':id/claim-points')
  @Roles(Role.PARENT)
  public async claimPoints(
    @Param() params: FindOneParams,
    @CurrentUser() currentUser: CurrentUserDto,
    @Body() pointsDto: PointsDto,
  ): Promise<User> {
    const childUser = await this.userService.findOneOrFail(params.id);

    await this.userService.checkParentUser(childUser, currentUser);

    return await this.userService.claimPoints(
      childUser,
      pointsDto.exchangePoints,
    );
  }

  @Patch('telegram-chat-id')
  async updateTelegramChatId(
    @CurrentUser() currentUser: CurrentUserDto,
    @Body() updateTelegramChatIdDto: UpdateTelegramChatIdDto,
  ) {
    return await this.userService.updateTelegramChatId(
      currentUser.id,
      updateTelegramChatIdDto.telegramChatId,
    );
  }
}
