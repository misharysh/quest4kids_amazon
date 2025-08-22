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
    const res = http.getResponse<Response>();

    const logger = this.loggingFactory.create('serverResponse');

    return next.handle().pipe(
      tap((data) => {
        const status = res.statusCode;
        const reason_phrase = res.statusMessage;

        const body = (() => {
          try {
            return typeof data === 'string' ? data : JSON.stringify(data ?? '');
          } catch {
            return '';
          }
        })();

        logger.log(LogLevel.info, 'HTTP Response', {
          status,
          reason_phrase,
          headers: {
            // 'Content-Type': contentType,
            // 'X-Trace-ID': responseTraceId,
            // 'X-Correlation-ID': responseCorrelationId,
            //TODO all headers
          },
          body,
        });
      }),
    );
  }
}
