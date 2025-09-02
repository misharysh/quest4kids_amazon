import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ILoggingFactory } from '../logging/logging.interfaces';
import { TypeormLoggerAdapter } from '../logging/typeorm/typeorm-logger-adapter';

@Injectable()
export class TypeormAdapterMiddleware implements NestMiddleware {
  constructor(
    @Inject('LoggingFactory')
    private readonly loggingFactory: ILoggingFactory,
    private readonly typeormAdapter: TypeormLoggerAdapter,
  ) {}
  use(request: Request, response: Response, next: NextFunction) {
    this.typeormAdapter.setLoggingFactory(this.loggingFactory);
    next();
  }
}
