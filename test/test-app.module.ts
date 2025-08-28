import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from 'src/app.controller';
import { AppService } from 'src/app.service';

import { StatisticsModule } from 'src/statistics/statistics.module';
import { TasksModule } from 'src/tasks/tasks.module';
import { DashboardSettingsModule } from 'src/dashboardSettings/dashboard-settings.module';
import { MessageModule } from 'src/messages/message.module';
import { UsersModule } from 'src/users/users.module';
import { BadgesModule } from 'src/badges/badges.module';
import { NotificationModule } from 'src/notifications/notification.module';
import { LoggingModule } from 'src/logging/logging.module';

import { PasswordService } from 'src/users/password/password.service';
import { AwsService } from 'src/aws/aws.service';
import { DashboardSettingsService } from 'src/dashboardSettings/dashboard-settings.service';
import { EmailService } from '../src/email/email.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432'),
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? '1310',
      database: process.env.DB_DATABASE ?? 'questForKids',
      autoLoadEntities: true,
      synchronize: true,
      dropSchema: true,
      logging: false,
    }),
    StatisticsModule,
    TasksModule,
    DashboardSettingsModule,
    MessageModule,
    UsersModule,
    BadgesModule,
    NotificationModule,
    LoggingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: AwsService,
      useValue: { uploadFile: async () => ({}), getSignedUrl: () => '', deleteFile: async () => true },
    },
    {
      provide: EmailService,
      useValue: { send: async () => undefined },
    },
    {
      provide: DashboardSettingsService,
      useValue: { save: async () => ({}), get: async () => ({}) },
    },
    {
      provide: PasswordService,
      useValue: { hash: async (p: string) => 'hashed:' + p, compare: async (p: string, h: string) => h === 'hashed:' + p },
    },
    {
      provide: 'TelegramService',
      useValue: { onModuleInit: async () => undefined },
    },
    {
      provide: 'BullQueue_default',
      useValue: { add: async () => undefined },
    }
  ],
})
export class TestAppModule {}
