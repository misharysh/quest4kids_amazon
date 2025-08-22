import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as os from 'os';
import { LoggingFactory } from './logging.factory';
import { LogLevel } from './log-level.enum';

@Injectable()
export class HttpRequestLoggingMiddleware implements NestMiddleware {
  constructor(private readonly loggingFactory: LoggingFactory) {}

  use(req: Request, _res: Response, next: NextFunction) {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const correlationId = (req.headers['x-correlation-id'] as string) || '';

    const clientIp =
      ((req.headers['x-forwarded-for'] as string) || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)[0] ||
      (req.ip || req.socket?.remoteAddress || '').toString();

    const hostName = os.hostname();
    const protocol = req.protocol || 'HTTP'; //TODO: x-forvarded-proto
    const url = req.originalUrl;
    const method = req.method?.toUpperCase();

    const logger = this.loggingFactory.create('serverRequest');
    logger.scope({
      traceId,
      correlationId,
    });

    const body = (() => {
      try {
        const b: unknown = (req as any).body;
        return typeof b === 'string' ? b : JSON.stringify(b ?? '');
      } catch {
        return '';
      }
    })();

    logger.log(LogLevel.info, 'HTTP Request', {
      clientIp,
      hostName,
      protocol,
      url,
      method,
      headers: {
        Authorization: (req.headers['authorization'] as string) ?? '',
        'Content-Type': (req.headers['content-type'] as string) ?? '',
        'X-Correlation-ID': correlationId,
        //TODO all headers
      },
      body,
    });

    next();
  }
}
