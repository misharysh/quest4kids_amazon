import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TasksModule } from './tasks/tasks.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { appConfig } from './config/app.config';
import { appConfigSchema, ConfigTypes } from './config/config-types';
import { typeOrmConfig } from './config/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './tasks/task.entity';
import { User } from './users/user.entity';
import { TaskLabel } from './tasks/task-label.entity';
import { authConfig } from './config/auth.config';
import { UsersModule } from './users/users.module';
import { amazonConfig } from './config/amazon.config';
import { RefreshToken } from './users/refresh-token.entity';
import { MailerModule } from '@nestjs-modules/mailer';
import { emailConfig, EmailConfig } from './config/email.config';
import { googleConfig } from './config/google-oauth.config';
import { UserTaskCompletion } from './users/user-task-completion.entity';
import { Badge } from './badges/badge.entity';
import { UserBadge } from './badges/user-badge.entity';
import { DashboardSettings } from './dashboardSettings/dashboard-settings.entity';
import { DashboardSettingsModule } from './dashboardSettings/dashboard-settings.module';
import { BadgesModule } from './badges/badges.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, typeOrmConfig, authConfig, amazonConfig, emailConfig, googleConfig],
      validationSchema: appConfigSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ConfigTypes>) => ({
        ...configService.get('database'),
        entities: [Task, User, TaskLabel, RefreshToken, UserTaskCompletion, Badge, UserBadge, DashboardSettings],
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: true,
        migrations: ['dist/migrations/*{.ts,.js}'],
        ssl: true,
        extra: {
          ssl: {
            rejectUnauthorized: false
          }
        },
      }),
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ConfigTypes>) => ({
        transport: {
          host: configService.get<EmailConfig>('email')?.emailHost,
          secure: true,
          port: 465,
          auth: {
            user: configService.get<EmailConfig>('email')?.emailUsername,
            pass: configService.get<EmailConfig>('email')?.emailPassword,
          },
        },
      }),
    }),
    TasksModule,
    UsersModule,
    DashboardSettingsModule,
    BadgesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}