import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
  Scope,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, catchError } from 'rxjs';
import { ILoggingFactory } from 'src/logging/logging.interfaces';

interface ErrorLogPayload {
  message: string;
  name?: string;
  stack?: string;
  route_template?: string;
  method?: string;
  url?: string;
  status?: number;
  correlationId?: string;
  traceId?: string;
  userId?: string;
}

@Injectable({ scope: Scope.REQUEST })
export class ErrorLoggingInterceptor implements NestInterceptor {
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
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const logger = await this.loggingFactory.create('serverError');

    return next.handle().pipe(
      catchError((err: any) => {
        const route_template =
          (request.baseUrl || '') + (request.route?.path || '');
        const payload: ErrorLogPayload = {
          message: err?.message ?? String(err),
          name: err?.name,
          stack: err?.stack,
          route_template,
          method: request.method,
          url: request.originalUrl,
          status: err?.status ?? response.statusCode,
          correlationId:
            (request.headers['x-correlation-id'] as string) ||
            request.correlationId,
          traceId: (request.headers['x-trace-id'] as string) || request.traceId,
          userId: (request as any).user?.id,
        };

        logger.error('Handled exception', payload);

        throw err;
      }),
    );
  }
}
