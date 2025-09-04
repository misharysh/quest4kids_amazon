import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { correlationAls } from 'src/logging/correlation.context';

@Injectable()
export class CorrelationAlsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = req.correlationId;
    const traceId = req.traceId;

    correlationAls.run({ correlationId, traceId }, () => next());
  }
}
