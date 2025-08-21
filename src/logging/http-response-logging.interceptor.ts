import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Scope,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable, tap } from 'rxjs';
import { LoggingFactory } from './logging.factory';
import { LogLevel } from './log-level.enum';

@Injectable({ scope: Scope.REQUEST })
export class HttpResponseLoggingInterceptor implements NestInterceptor {
  constructor(private readonly loggingFactory: LoggingFactory) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (!this.loggingFactory) {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const traceId =
      (req.headers['x-trace-id'] as string) ||
      (req.headers['x-traceid'] as string) ||
      '';

    const correlationId =
      (req.headers['x-correlation-id'] as string) ||
      (req.headers['x-correlationid'] as string) ||
      '';

    const protocol = 'HTTP';

    const logger = this.loggingFactory.create('http', 'console');

    return next.handle().pipe(
      tap((data) => {
        const status = res.statusCode;
        const reason_phrase = res.statusMessage || 'OK';

        const contentType = (res.getHeader('content-type') as string) || '';
        const responseTraceId =
          (res.getHeader('X-Trace-ID') as string) || traceId;
        const responseCorrelationId =
          (res.getHeader('X-Correlation-ID') as string) || correlationId;

        const body = (() => {
          try {
            return typeof data === 'string' ? data : JSON.stringify(data ?? '');
          } catch {
            return '';
          }
        })();

        logger.log(LogLevel.info, 'HTTP Response', {
          traceId,
          correlationId,
          protocol,
          status,
          reason_phrase,
          headers: {
            'Content-Type': contentType,
            'X-Trace-ID': responseTraceId,
            'X-Correlation-ID': responseCorrelationId,
          },
          body,
        });
      }),
    );
  }
}
