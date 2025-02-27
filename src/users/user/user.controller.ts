import { Body, Controller, Get, Post, Query} from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../role.enum';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../user.entity';
import { UserService } from './user.service';
import { CurrentUserId } from '../decorators/current-user-id.decorator';
import { PaginationResponse } from 'src/common/pagination.response';
import { PaginationParams } from 'src/common/pagination.params';

@Controller('user')
export class UserController {
    constructor(
        private readonly usersService: UserService
    ) {};

    @Post('create-child-account')
    @Roles(Role.PARENT)
    async createChildAccount(
        @Body() createUserDto: CreateUserDto,
        @CurrentUserId() userId: string,
    ): Promise<User>
    {
        const childAccount = await this.usersService.createChildAccount(createUserDto, userId);

        return childAccount;
    };

    @Get('get-children-list')
    @Roles(Role.PARENT)
    async getChildrenList(
        @Query() pagination: PaginationParams,
        @CurrentUserId() userId: string) : Promise<PaginationResponse<User>>
    {
        const [items, total] = await this.usersService.findAll(pagination,userId);

        return {
            data: items,
            meta: {
                total,
                offset: pagination.offset,
                limit: pagination.limit
            }
        }
    };
}
