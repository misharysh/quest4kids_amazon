import { Global, Module, Scope } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseLogEntity } from './database-logging.entity';
import { ConsoleLoggingFactory } from './loggers/console-logging.factory';
import { DatabaseLoggingFactory } from './loggers/database-logging.factory';
import { LoggingScope } from './logging.scope';
import { LoggingFactoryProvider } from './logging-factory.provider';
import { CompoundLoggingFactory } from './loggers/compound-logging.factory';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([DatabaseLogEntity])],
  providers: [
    LoggingScope,
    ConsoleLoggingFactory,
    DatabaseLoggingFactory,
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
      ) => new CompoundLoggingFactory(scope, [consoleFactory, databaseFactory]),
      inject: [LoggingScope, ConsoleLoggingFactory, DatabaseLoggingFactory],
      scope: Scope.REQUEST,
    },
    LoggingFactoryProvider,
  ],
  exports: ['LoggingFactory'],
})
export class LoggingModule {}
