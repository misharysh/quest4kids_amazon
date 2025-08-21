import { Injectable, Scope } from '@nestjs/common';
import { LogEntry } from '../log-entry';
import { LogLevel } from '../log-level.enum';
import { ILoggingService } from '../logging.interfaces';

@Injectable({ scope: Scope.REQUEST })
export class ConsoleLoggingService implements ILoggingService {
  private context: Record<string, any> = {};
  private category = '';

  setCategory(category: string) {
    this.category = category;
  }

  scope(properties: Record<string, any>): void {
    this.context = { ...this.context, ...properties };
  }

  log(level: LogLevel, message: string, properties?: object): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category: this.category,
      message,
      properties: {
        ...this.context,
        ...(properties || {}),
      },
    };

    console.log(JSON.stringify(entry));
  }
}
