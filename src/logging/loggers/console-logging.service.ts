import { Injectable, Scope } from '@nestjs/common';
import { LogEntry } from '../log-entry';
import { LogLevel } from '../log-level.enum';
import { LoggingScope } from '../logging.scope';
import { LoggingServiceBase } from '../logging.service.base';

@Injectable({ scope: Scope.TRANSIENT })
export class ConsoleLoggingService extends LoggingServiceBase {
  constructor(
    private readonly loggingScope: LoggingScope,
    private readonly category: string,
  ) {
    super();
  }

  scope(properties: Record<string, any>): void {
    this.loggingScope.context = {
      ...this.loggingScope.context,
      ...properties,
    };
  }

  log(level: LogLevel, message: string, properties?: object): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category: this.category,
      message,
      properties: {
        ...this.loggingScope.context,
        ...(properties || {}),
      },
    };

    console.log(JSON.stringify(entry));
  }
}
