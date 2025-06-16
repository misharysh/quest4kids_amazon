import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConfigTypes } from './../config/config-types';
import { AuthConfig } from './../config/auth.config';
import { PasswordService } from './password/password.service';
import { UserService } from './user/user.service';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { AuthGuard } from './guards/auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './guards/roles.guard';
import { UserController } from './user/user.controller';
import { AwsService } from './../aws/aws.service';
import { RefreshToken } from './refresh-token.entity';
import { EmailService } from '../email/email.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { DashboardSettingsService } from '../dashboardSettings/dashboard-settings.service';
import { DashboardSettings } from '../dashboardSettings/dashboard-settings.entity';
import { NotificationService } from '../notifications/notification.service';
import { Notification } from '../notifications/notification.entity';
import { NotificationGateway } from '../notifications/notification.gateway';
import { OnlineService } from './online/online.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    RedisModule,
    TypeOrmModule.forFeature([
      User,
      RefreshToken,
      DashboardSettings,
      Notification,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<ConfigTypes>) => ({
        secret: config.get<AuthConfig>('auth')?.jwt.secret,
        signOptions: {
          expiresIn: config.get<AuthConfig>('auth')?.jwt.expiresIn,
        },
      }),
    }),
  ],
  providers: [
    PasswordService,
    OnlineService,
    EmailService,
    AwsService,
    UserService,
    AuthService,
    NotificationService,
    DashboardSettingsService,
    NotificationGateway,
    GoogleStrategy,
    AuthGuard,
    RolesGuard,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  controllers: [AuthController, UserController],
  exports: [UserService],
})
export class UsersModule {}
