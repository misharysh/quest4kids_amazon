import { Body, Controller, Get, Post, Query} from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../role.enum';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../user.entity';
import { UserService } from './user.service';
import { CurrentUser } from '../decorators/current-user.decorator';
import { PaginationResponse } from 'src/common/pagination.response';
import { PaginationParams } from 'src/common/pagination.params';
import { CurrentUserDto } from '../dto/current-user.dto';

@Controller('user')
export class UserController {
    constructor(
        private readonly usersService: UserService
    ) {};

    @Post('create-child-account')
    @Roles(Role.PARENT)
    async createChildAccount(
        @Body() createUserDto: CreateUserDto,
        @CurrentUser() currentUser: CurrentUserDto,
    ): Promise<User>
    {
        const childAccount = await this.usersService.createChildAccount(createUserDto, currentUser.id);

        return childAccount;
    };

    @Get('get-children-list')
    @Roles(Role.PARENT)
    async getChildrenList(
        @Query() pagination: PaginationParams,
        @CurrentUser() currentUser: CurrentUserDto
    ) : Promise<PaginationResponse<User>>
    {
        const [items, total] = await this.usersService.findAll(pagination, currentUser.id);

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
