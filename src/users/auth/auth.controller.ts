import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  NotFoundException,
  Patch,
  Post,
  Req,
  Res,
  SerializeOptions,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../user.entity';
import { AuthService } from './auth.service';
import { LoginDto } from '../dto/login.dto';
import { LoginResponse } from '../dto/login.response.dto';
import { UserService } from '../user/user.service';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { CurrentUserDto } from '../dto/current-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../role.enum';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto copy';
import { RefreshDto } from '../dto/refresh.dto';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { NotificationService } from '../../notifications/notification.service';
import { ProfileResponseDto } from '../dto/profile.response.dto';
import { plainToInstance } from 'class-transformer';
import { populate } from '../user/mappers/user-mapper';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({ strategy: 'excludeAll' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
  ) {}

  @Post('register')
  @Public()
  public async register(@Body() createUserDto: CreateUserDto): Promise<User> {
    const user = await this.authService.register(createUserDto);

    return user;
  }

  @Post('login')
  @Public()
  public async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    const { accessToken, refreshToken } = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );

    return new LoginResponse({ accessToken, refreshToken });
  }

  @Post('refresh')
  @Public()
  public async refresh(@Body() refreshDto: RefreshDto): Promise<LoginResponse> {
    const { accessToken, refreshToken } = await this.authService.refreshTokens(
      refreshDto.token,
    );

    if (!accessToken) {
      throw new UnauthorizedException();
    }

    return new LoginResponse({ accessToken, refreshToken });
  }

  @Get('profile')
  public async profile(
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<ProfileResponseDto> {
    const user = await this.userService.findOne(currentUser.id);

    if (!user) {
      throw new NotFoundException();
    }

    const unreadNotificationCount =
      await this.notificationService.getUserNotificationCount(user.id, {
        isRead: false,
      });

    const profile = plainToInstance(
      ProfileResponseDto,
      {
        ...user,
        unreadNotificationCount,
      },
      { excludeExtraneousValues: true },
    );

    return profile;
  }

  @Patch('profile')
  @Roles(Role.PARENT)
  public async updateProfile(
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<User> {
    const user = await this.userService.findOne(currentUser.id);

    if (!user) {
      throw new NotFoundException();
    }
    await populate(user, updateUserDto);
    return await this.userService.updateUser(user);
  }

  @Post('forgot-password')
  @Public()
  public async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(
      forgotPasswordDto.email,
    );

    console.log('RETURNING:', result);
    return result;
  }

  @Post('reset-password')
  @Public()
  public async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<void> {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );
  }

  @Get('google/login')
  @Public()
  @UseGuards(GoogleAuthGuard)
  public async googleLogin() {}

  @Get('google/callback')
  @Public()
  @UseGuards(GoogleAuthGuard)
  public async googleCallback(@Req() req): Promise<LoginResponse> {
    const { accessToken, refreshToken } =
      await this.authService.loginWithGoogle(req.user);

    return new LoginResponse({ accessToken, refreshToken });
  }
}
