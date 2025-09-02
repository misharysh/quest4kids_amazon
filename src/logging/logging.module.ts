import { Global, Module, Scope } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseLogEntity } from './database-logging.entity';
import { ConsoleLoggingFactory } from './loggers/console-logging.factory';
import { DatabaseLoggingFactory } from './loggers/database-logging.factory';
import { LoggingScope } from './logging.scope';
import { LoggingFactoryProvider } from './logging-factory.provider';
import { CompoundLoggingFactory } from './loggers/compound-logging.factory';
import { AwsCloudWatchClient } from './loggers/aws/aws-cloudwatch.client';
import { AwsCloudWatchLoggingFactory } from './loggers/aws-cloudwatch-logging.factory';
import { AWS_CLOUDWATCH_LOGGING_OPTIONS } from './loggers/aws/aws-cloud-watch-logging.options';
import { TypeormLoggerAdapter } from './typeorm/typeorm-logger-adapter';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([DatabaseLogEntity])],
  providers: [
    LoggingScope,
    ConsoleLoggingFactory,
    DatabaseLoggingFactory,
    AwsCloudWatchLoggingFactory,
    {
      provide: AWS_CLOUDWATCH_LOGGING_OPTIONS,
      useValue: {
        logGroupName: process.env.AWS_LOG_GROUP ?? 'my-service-logs',
        logStreamName: process.env.AWS_LOG_STREAM ?? 'api-1',
        region: process.env.AWS_REGION,
        flushIntervalMs: 2000,
        maxBatchSize: 10000,
        maxBatchBytes: 960000,
        retentionInDays: 14,
      },
    },
    AwsCloudWatchClient,
    // {
    //     provide: 'LoggingFactory',
    //     scope: Scope.REQUEST,
    //     useFactory: (
    //         config: ConfigService,
    //         consoleFactory: ConsoleLoggingFactory,
    //         databaseFactory: DatabaseLoggingFactory
    //     ): ILoggingFactory => {
    //         const type = config.get<'console' | 'database'>("LOGGING_TYPE", 'console');

    //         return type === 'console' ? consoleFactory : databaseFactory;
    //     },
    //     inject: [ConfigService, ConsoleLoggingFactory, DatabaseLoggingFactory],
    // },
    {
      provide: CompoundLoggingFactory,
      useFactory: (
        scope: LoggingScope,
        consoleFactory: ConsoleLoggingFactory,
        databaseFactory: DatabaseLoggingFactory,
        awsFactory: AwsCloudWatchLoggingFactory,
      ) =>
        new CompoundLoggingFactory(scope, [
          consoleFactory,
          databaseFactory,
          awsFactory,
        ]),
      inject: [
        LoggingScope,
        ConsoleLoggingFactory,
        DatabaseLoggingFactory,
        AwsCloudWatchLoggingFactory,
      ],
      scope: Scope.REQUEST,
    },
    LoggingFactoryProvider,
    TypeormLoggerAdapter,
  ],
  exports: ['LoggingFactory', TypeormLoggerAdapter],
})
export class LoggingModule {}
