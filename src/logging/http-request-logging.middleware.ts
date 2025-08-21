import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as os from 'os';
import { LoggingFactory } from './logging.factory';
import { LogLevel } from './log-level.enum';

@Injectable()
export class HttpRequestLoggingMiddleware implements NestMiddleware {
  constructor(private readonly loggingFactory: LoggingFactory) {}

  use(req: Request, _res: Response, next: NextFunction) {
    const traceId =
      (req.headers['x-trace-id'] as string) ||
      (req.headers['x-traceid'] as string) ||
      '';

    const correlationId =
      (req.headers['x-correlation-id'] as string) ||
      (req.headers['x-correlationid'] as string) ||
      '';

    const clientIp =
      ((req.headers['x-forwarded-for'] as string) || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)[0] ||
      (req.ip || req.socket?.remoteAddress || '').toString();

    const hostName = os.hostname();
    const protocol = 'HTTP';
    const url = req.originalUrl || req.url;
    const method = req.method?.toUpperCase() || 'GET';

    const logger = this.loggingFactory.create('http');
    logger.scope({
      traceId,
      correlationId,
      clientIp,
      hostName,
      protocol,
      url,
      method,
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
      traceId,
      correlationId,
      clientIp,
      hostName,
      protocol,
      url,
      method,
      headers: {
        Authorization: (req.headers['authorization'] as string) ?? '',
        'Content-Type': (req.headers['content-type'] as string) ?? '',
        'X-Correlation-ID': correlationId,
      },
      body,
    });

    next();
  }
}
