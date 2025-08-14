import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';

@Injectable()
export class CorrelationTraceInterceptor implements NestInterceptor {
  private static toUuidNoDashes(): string {
    return uuidv4().replace(/-/g, '');
  }

  private static normalizeHeaderValue(
    value: string | string[] | undefined,
  ): string | undefined {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value?.toString();
  }

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    if (context.getType() === 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const traceId = CorrelationTraceInterceptor.toUuidNoDashes();

    const headerDirect = req.get('X-Correlation-ID') ?? undefined;
    const headerRaw =
      headerDirect ??
      CorrelationTraceInterceptor.normalizeHeaderValue(
        req.headers['x-correlation-id'],
      );

    const correlationId = (
      headerRaw?.trim() || CorrelationTraceInterceptor.toUuidNoDashes()
    ).replace(/-/g, '');

    res.setHeader('X-Trace-ID', traceId);
    res.setHeader('X-Correlation-ID', correlationId);

    return next.handle();
  }
}
