import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request, Response } from 'express';
import { generateUuidNoDashes } from '../common/utils/identityGenerator';
import { CORRELATION_HEADER } from '../common/constants/headers';

@Injectable()
export class CorrelationIdentityInterceptor implements NestInterceptor {
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

    const incoming = request.get(CORRELATION_HEADER) ?? undefined; //searches only in request headers
    const correlationId: string = incoming?.trim() || generateUuidNoDashes();

    response.setHeader(CORRELATION_HEADER, correlationId);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (request as any).correlationId = correlationId;

    return next.handle();
  }
}
