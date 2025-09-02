import { Injectable, Scope } from '@nestjs/common';
import { ILoggingFactory, ILoggingService } from '../logging.interfaces';
import { LoggingScope } from '../logging.scope';
import { ConsoleLoggingService } from './console-logging.service';

@Injectable({ scope: Scope.REQUEST })
export class ConsoleLoggingFactory implements ILoggingFactory {
  constructor(private readonly loggingScope: LoggingScope) {}

  create(category: string): ILoggingService {
    return new ConsoleLoggingService(this.loggingScope, category);
  }
}
