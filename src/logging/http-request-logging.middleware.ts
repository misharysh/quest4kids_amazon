import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as os from 'os';
import { ILoggingFactory } from 'src/logging/logging.interfaces';

@Injectable()
export class HttpRequestLoggingMiddleware implements NestMiddleware {
  constructor(
    @Inject('LoggingFactory')
    private readonly loggingFactory: ILoggingFactory,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const traceId =
      (req.headers['x-trace-id'] as string) || (req.traceId as string);
    const correlationId =
      (req.headers['x-correlation-id'] as string) ||
      (req.correlationId as string);

    const clientIp =
      ((req.headers['x-forwarded-for'] as string) || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)[0] ||
      (req.ip || req.socket?.remoteAddress || '').toString();

    const hostName = os.hostname();
    let protocol = (req.headers['x-forwarded-proto'] as string | undefined)
      ?.split(',')[0]
      ?.trim()
      ?.toLowerCase();
    if (protocol !== 'https' && protocol !== 'http') {
      protocol = req.protocol || '';
    }

    const url = req.originalUrl;
    const method = req.method?.toUpperCase();

    const logger = await this.loggingFactory.create('serverRequest');
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

    logger.info('HTTP Request', {
      clientIp,
      hostName,
      protocol,
      url,
      method,
      headers: req.rawHeaders,
      body,
    });

    next();
  }
}
