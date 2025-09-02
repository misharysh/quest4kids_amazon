import { ModuleRef } from '@nestjs/core';
import { ILoggingFactory, ILoggingService } from '../logging.interfaces';
import { LoggingScope } from '../logging.scope';
import { DatabaseLoggingService } from './database-logging.service';
import { Injectable, Scope } from '@nestjs/common';
import { DatabaseLogEntity } from '../database-logging.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable({ scope: Scope.REQUEST })
export class DatabaseLoggingFactory implements ILoggingFactory {
  constructor(
    private readonly loggingScope: LoggingScope,
    @InjectRepository(DatabaseLogEntity)
    private readonly logRepository: Repository<DatabaseLogEntity>,
  ) {}

  create(category: string): ILoggingService {
    return new DatabaseLoggingService(
      this.loggingScope,
      category,
      this.logRepository,
    );
  }
}
