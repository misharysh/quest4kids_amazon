import { Provider, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggingScope } from './logging.scope';
import { ConsoleLoggingFactory } from './loggers/console-logging.factory';
import { DatabaseLoggingFactory } from './loggers/database-logging.factory';
import { CompoundLoggingFactory } from './loggers/compound-logging.factory';
import { ILoggingFactory } from './logging.interfaces';
import { LoggingType } from './logging.type';

export const LoggingFactoryProvider: Provider = {
  provide: 'LoggingFactory',
  scope: Scope.REQUEST,
  useFactory: (
    config: ConfigService,
    scope: LoggingScope,
    consoleFactory: ConsoleLoggingFactory,
    databaseFactory: DatabaseLoggingFactory,
    compoundFactory: CompoundLoggingFactory,
  ): ILoggingFactory => {
    const type = config.get<string>('LOGGING_TYPE') as LoggingType;

    switch (type) {
      case LoggingType.CONSOLE:
        return consoleFactory;
      case LoggingType.DATABASE:
        return databaseFactory;
      case LoggingType.COMPOUND:
        return compoundFactory;
      default:
        return consoleFactory;
    }
  },
  inject: [
    ConfigService,
    LoggingScope,
    ConsoleLoggingFactory,
    DatabaseLoggingFactory,
    CompoundLoggingFactory,
  ],
};
