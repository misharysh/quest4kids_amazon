import { Body, ClassSerializerInterceptor, Controller, Get, NotFoundException, Post, Request, SerializeOptions, UseInterceptors } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../user.entity';
import { AuthService } from './auth.service';
import { LoginDto } from '../dto/login.dto';
import { LoginResponse } from '../dto/login.response.dto';
import { request } from 'http';
import { AuthRequest } from '../auth.request';
import { UserService } from '../user/user.service';
import { Public } from '../decorators/public.decorator';
import { ParentResponse } from '../dto/parent.response.dto';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../role.enum';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({strategy: 'excludeAll'})
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly usersService: UserService
    ) {};

    @Post('register')
    @Public()
    async register(@Body() createUserDto: CreateUserDto): Promise<User>
    {
        const user = await this.authService.register(createUserDto);

        return user;
    };

    @Post('login')
    @Public()
    async login(@Body() loginDto: LoginDto): Promise<LoginResponse>
    {
        const accessToken = await this.authService.login(loginDto.email, loginDto.password);

        return new LoginResponse({accessToken});
    };

    @Get('profile')
    async profile(@Request() request: AuthRequest): Promise<User>
    {
        const user = await this.usersService.findOne(request.user.sub);

        if (user)
        {
            return user;
        }

        throw new NotFoundException();
    };

    @Get('parent')
    @Roles(Role.PARENT)
    async parentOnly(): Promise<ParentResponse>
    {
        return new ParentResponse({message: "This is for Parent role only."});
    }
}
