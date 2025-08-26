import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
  Scope,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable, tap } from 'rxjs';
import { ILoggingFactory } from 'src/logging/logging.interfaces';

@Injectable({ scope: Scope.REQUEST })
export class HttpResponseLoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject('LoggingFactory')
    private readonly loggingFactory: ILoggingFactory,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    if (!this.loggingFactory) {
      return next.handle();
    }

    const http = context.switchToHttp();
    const res = http.getResponse<Response>();

    const logger = await this.loggingFactory.create('serverResponse');

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

        logger.info('HTTP Response', {
          status,
          reason_phrase,
          headers: res.getHeaders(),
          body,
        });
      }),
    );
  }
}
