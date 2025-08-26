import { ILoggingService } from '../logging.interfaces';
import { DatabaseLogEntity } from '../database-logging.entity';
import { Repository } from 'typeorm';
import { LogLevel } from '../log-level.enum';
import { Injectable, Scope } from '@nestjs/common';
import { LoggingScope } from '../logging.scope';
import { LoggingServiceBase } from '../logging.service.base';

@Injectable({ scope: Scope.TRANSIENT })
export class DatabaseLoggingService extends LoggingServiceBase {
  constructor(
    private readonly loggingScope: LoggingScope,
    private readonly category: string,
    private readonly logRepository: Repository<DatabaseLogEntity>,
  ) {
    super();
  }

  scope(properties: Record<string, any>): void {
    this.loggingScope.context = {
      ...this.loggingScope.context,
      ...properties,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async log(
    level: LogLevel,
    message: string,
    properties?: object,
  ): Promise<void> {
    const entry = this.logRepository.create({
      timestamp: new Date().toISOString(),
      level,
      category: this.category,
      message,
      properties: {
        ...this.loggingScope.context,
        ...(properties || {}),
      },
    });

    await this.logRepository.save(entry);
  }
}
