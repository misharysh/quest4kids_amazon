import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, HttpCode, HttpStatus, NotFoundException, Param, Patch, Post, Query, UploadedFile, UseInterceptors} from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../role.enum';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../user.entity';
import { UserService } from './user.service';
import { CurrentUser } from '../decorators/current-user.decorator';
import { PaginationResponse } from 'src/common/pagination.response';
import { PaginationParams } from 'src/common/pagination.params';
import { CurrentUserDto } from '../dto/current-user.dto';
import { FindOneParams } from 'src/tasks/find-one.params';
import { UpdateUserDto } from '../dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('user')
export class UserController {
    constructor(
        private readonly usersService: UserService
    ) {};

    @Get('get-child-account/:id')
    @Roles(Role.PARENT)
    public async getChild(
        @Param() params: FindOneParams,
        @CurrentUser() currentUser: CurrentUserDto
    ) : Promise<User>
    {
        const childUser = await this.findOneOrFail(params.id);

        await this.checkParentUser(childUser, currentUser);

        return childUser;
    };

    @Get('get-children-list')
    @Roles(Role.PARENT)
    public async getChildrenList(
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

    @Post('create-child-account')
    @Roles(Role.PARENT)
    public async createChildAccount(
        @Body() createUserDto: CreateUserDto,
        @CurrentUser() currentUser: CurrentUserDto,
    ): Promise<User>
    {
        const childUser = await this.usersService.createChildAccount(createUserDto, currentUser.id);

        return childUser;
    };

    @Patch('update-child-account/:id')
    @Roles(Role.PARENT)
    public async updateChild(
        @Param() params: FindOneParams,
        @Body() updateUserDto: UpdateUserDto,
        @CurrentUser() currentUser: CurrentUserDto
    ): Promise<User>
    {
        const childUser = await this.findOneOrFail(params.id);

        await this.checkParentUser(childUser, currentUser);

        return await this.usersService.updateUser(childUser, updateUserDto);
    };

    @Delete('remove-child-account/:id')
    @Roles(Role.PARENT)
    @HttpCode(HttpStatus.NO_CONTENT)
    public async deleteChild(
        @Param() params: FindOneParams,
        @CurrentUser() currentUser: CurrentUserDto
    ): Promise<void>
    {
        const childUser = await this.findOneOrFail(params.id);

        await this.checkParentUser(childUser, currentUser);

        await this.usersService.deleteUser(childUser);
    };

    @Post(':id/avatar')
    @UseInterceptors(FileInterceptor('file',{
        fileFilter: (req, file, callback) => {
            return file.mimetype.match(/image\/(jpg|jpeg|png|gif)$/)
                ? callback(null, true)
                : callback(new BadRequestException('Only image files are allowed'), false);
        }
    }))
    public async addAvatar(
        @Param() params: FindOneParams,
        @CurrentUser() currentUser: CurrentUserDto,
        @UploadedFile() file: Express.Multer.File
    ): Promise<User>
    {
        const user = await this.checkAvatarOwnership(params, currentUser);

        return this.usersService.addAvatar(user, file);
    };

    @Get(':id/avatar')
    public async getAvatar(
        @Param() params: FindOneParams,
        @CurrentUser() currentUser: CurrentUserDto
    ): Promise<string>
    {
        const user = await this.checkAvatarOwnership(params, currentUser);

        if (!user.avatarName)
        {
            throw new NotFoundException('User does not havea any avatar');
        }

        const url = await this.usersService.getAvatar(user.avatarName);

        return url;
    };

    private async checkAvatarOwnership(params: FindOneParams, currentUser: CurrentUserDto): Promise<User>
    {
        const isParent = currentUser.role === Role.PARENT;

        if (isParent)
        {
            const pagination = new PaginationParams();
            const [items, total] = await this.usersService.findAll(pagination, currentUser.id);

            if (!items.some((user) => user.id === params.id))
            {
                throw new ForbiddenException('You can only access avatars of you children');
            }

            const user = items.find((user) => user.id === params.id);

            if (user)
            {
                return user;
            }
            else
            {
                throw new NotFoundException('User Not Found');
            }
        }
        else
        {
            if (params.id !== currentUser.id)
            {
                throw new ForbiddenException('You can only access your avatar');
            }

            return await this.findOneOrFail(params.id);
        }
    };

    private async findOneOrFail(id: string): Promise<User>
    {
        const user = await this.usersService.findOne(id);

        if (!user)
        {
            throw new NotFoundException();
        }
        
        return user;
    }

    private async checkParentUser(child: User, parent: CurrentUserDto)
    {
        //check if this childUser has ParentId as current user id
        if (child.parentId !== parent.id)
        {
            throw new ForbiddenException('You can only access your children');
        }
    }
}
