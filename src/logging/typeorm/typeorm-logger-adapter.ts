import { Logger } from 'typeorm/logger/Logger';
import { QueryRunner } from 'typeorm';
import { ILoggingFactory, ILoggingService } from '../logging.interfaces';
import { AsyncLocalStorage } from 'async_hooks';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TypeormLoggerAdapter implements Logger {
  private readonly asyncLocal: AsyncLocalStorage<ILoggingFactory>;
  constructor() {
    this.asyncLocal = new AsyncLocalStorage();
  }
  log(
    _level: 'log' | 'info' | 'warn',
    message: any,
    queryRunner?: QueryRunner,
  ): any {
    const logger = this.getLogger();
    if (!logger) {
      return;
    }
    if (_level === 'log' || _level === 'info') {
      logger.info(String(message), {});
    } else if (_level === 'warn') {
      logger.warning(String(message), {});
    }
  }

  logMigration(message: string, queryRunner?: QueryRunner): any {
    const logger = this.getLogger();
    if (!logger) {
      return;
    }
    logger.debug(message, {});
  }

  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner): any {
    const logger = this.getLogger();
    if (!logger) {
      return;
    }
    logger.info(query, { parameters });
  }

  logQueryError(
    error: string | Error,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner,
  ): any {
    const logger = this.getLogger();
    if (!logger) {
      return;
    }
    logger.error(String(error), { query, parameters });
  }

  logQuerySlow(
    time: number,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner,
  ): any {
    const logger = this.getLogger();
    if (!logger) {
      return;
    }
    logger.warning(String(time), { query, parameters });
  }

  logSchemaBuild(message: string, queryRunner?: QueryRunner): any {
    const logger = this.getLogger();
    if (!logger) {
      return;
    }
    logger.debug(message, {});
  }

  setLoggingFactory(factory: ILoggingFactory) {
    this.asyncLocal.enterWith(factory);
  }

  private getLogger(): ILoggingService | null {
    const loggingFactory = this.asyncLocal.getStore();
    if (!loggingFactory) {
      return null;
    }
    return loggingFactory.create('typeorm');
  }
}
