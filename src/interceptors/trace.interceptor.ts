import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { generateUuidNoDashes } from '../common/utils/idsGeneration';
import { Request, Response } from 'express';
import { TRACE_HEADER } from '../common/constants/headers';

@Injectable()
export class TraceInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const traceId = generateUuidNoDashes();

    response.setHeader(TRACE_HEADER, traceId);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (request as any).traceid = traceId;

    return next.handle();
  }
}
