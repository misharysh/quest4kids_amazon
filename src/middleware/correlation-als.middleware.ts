import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { correlationAls } from 'src/logging/correlation.context';
import { ILoggingFactory } from '../logging/logging.interfaces';

@Injectable()
export class CorrelationAlsMiddleware implements NestMiddleware {
  constructor(
    @Inject('LoggingFactory')
    private readonly loggingFactory: ILoggingFactory,
  ) {}
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = req.correlationId;
    const traceId = req.traceId;
    const loggingFactory = this.loggingFactory;

    correlationAls.run({ correlationId, traceId, loggingFactory }, () =>
      next(),
    );
  }
}
