import { Body, ClassSerializerInterceptor, Controller, Get, NotFoundException, Post, SerializeOptions, UnauthorizedException, UseInterceptors } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../user.entity';
import { AuthService } from './auth.service';
import { LoginDto } from '../dto/login.dto';
import { LoginResponse } from '../dto/login.response.dto';
import { UserService } from '../user/user.service';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { CurrentUserDto } from '../dto/current-user.dto';

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
    public async register(@Body() createUserDto: CreateUserDto): Promise<User>
    {
        const user = await this.authService.register(createUserDto);

        return user;
    };

    @Post('login')
    @Public()
    public async login(@Body() loginDto: LoginDto): Promise<LoginResponse>
    {
        const {accessToken, refreshToken} = await this.authService.login(loginDto.email, loginDto.password);

        return new LoginResponse({accessToken, refreshToken});
    };

    @Get('profile')
    public async profile(@CurrentUser() currentUser: CurrentUserDto): Promise<User>
    {
        const user = await this.usersService.findOne(currentUser.id);

        if (user)
        {
            return user;
        }

        throw new NotFoundException();
    };

    @Post('refresh')
    @Public()
    public async refresh(@Body() body: any):  Promise<LoginResponse>
    {
        const {accessToken, refreshToken} = await this.authService.refreshTokens(body.token);

        if (!accessToken)
        {
            throw new UnauthorizedException();
        }

        return new LoginResponse({accessToken, refreshToken});
    }; 
}
