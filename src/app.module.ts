import { MiddlewareConsumer, Module, Scope } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TasksModule } from './tasks/tasks.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { appConfig } from './config/app.config';
import { appConfigSchema, ConfigTypes } from './config/config-types';
import { typeOrmConfig } from './config/database.config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Task } from './tasks/task.entity';
import { User } from './users/user.entity';
import { TaskLabel } from './tasks/task-label.entity';
import { authConfig } from './config/auth.config';
import { UsersModule } from './users/users.module';
import { amazonConfig } from './config/amazon.config';
import { RefreshToken } from './users/refresh-token.entity';
import { emailConfig } from './config/email.config';
import { googleConfig } from './config/google-oauth.config';
import { UserTaskCompletion } from './users/user-task-completion.entity';
import { Badge } from './badges/badge.entity';
import { UserBadge } from './badges/user-badge.entity';
import { DashboardSettings } from './dashboardSettings/dashboard-settings.entity';
import { DashboardSettingsModule } from './dashboardSettings/dashboard-settings.module';
import { BadgesModule } from './badges/badges.module';
import { Notification } from './notifications/notification.entity';
import { Message } from './messages/message.entity';
import { MessageModule } from './messages/message.module';
import { BullModule } from '@nestjs/bullmq';
import { RedisModule } from './redis/redis.module';
import { StatisticsModule } from './statistics/statistics.module';
import { redisConfig } from './config/bull.config';
import { TelegramService } from './telegram/telegram.service';
import { TelegramModule } from './telegram/telegram.module';
import { LoggingModule } from './logging/logging.module';
import { DatabaseLogEntity } from './logging/database-logging.entity';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { HttpResponseLoggingInterceptor } from './logging/http-response-logging.interceptor';
import { HttpRequestLoggingMiddleware } from './logging/http-request-logging.middleware';
import { NestModule } from '@nestjs/common';
import { TraceIdentityMiddleware } from './middleware/trace-identity.middleware';
import { CorrelationIdentityMiddleware } from './middleware/correlation.identity.middleware';
import { ErrorLoggingInterceptor } from './common/error-logging.interceptor';
import { RouteTemplateInterceptors } from './interceptors/route-template.interceptors';
import { TypeormAdapterMiddleware } from './middleware/typeorm-adapter.middleware';
import { TypeormLoggerAdapter } from './logging/typeorm/typeorm-logger-adapter';
import { CorrelationAlsMiddleware } from './middleware/correlation-als.middleware';
import { IdentityModule } from './identityService/identity.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        typeOrmConfig,
        authConfig,
        amazonConfig,
        emailConfig,
        googleConfig,
      ],
      validationSchema: appConfigSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule, IdentityModule],
      inject: [ConfigService, TypeormLoggerAdapter],
      useFactory: (
        configService: ConfigService<ConfigTypes>,
        typeormLogger: TypeormLoggerAdapter,
      ) => {
        const isTest = process.env.NODE_ENV === 'test';

        const dbFromConfig =
          configService.get<TypeOrmModuleOptions>('database') || {};

        return {
          ...dbFromConfig,
          entities: [
            Task,
            User,
            TaskLabel,
            RefreshToken,
            UserTaskCompletion,
            Badge,
            UserBadge,
            DashboardSettings,
            Notification,
            Message,
            DatabaseLogEntity,
          ],
          autoLoadEntities: true,
          synchronize: false,
          migrationsRun: !isTest,
          logger: typeormLogger,
          migrations: [
            isTest ? 'src/migrations/*{.ts,.js}' : 'dist/migrations/*{.ts,.js}',
          ],
          ssl: !isTest,
          extra: isTest
            ? {}
            : {
                ssl: { rejectUnauthorized: false },
              },
        };
      },
    }),
    TasksModule,
    UsersModule,
    DashboardSettingsModule,
    BadgesModule,
    MessageModule,
    StatisticsModule,
    RedisModule,
    BullModule.forRoot(redisConfig),
    TelegramModule,
    LoggingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TelegramService,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpResponseLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      scope: Scope.REQUEST,
      useClass: ErrorLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      scope: Scope.REQUEST,
      useClass: RouteTemplateInterceptors,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        TypeormAdapterMiddleware,
        TraceIdentityMiddleware,
        CorrelationIdentityMiddleware,
        CorrelationAlsMiddleware,
        HttpRequestLoggingMiddleware,
      )
      .forRoutes('*');
  }
}
