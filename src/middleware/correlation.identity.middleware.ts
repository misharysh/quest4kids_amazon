import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { generateUuidNoDashes } from 'src/common/utils/identityGenerator';
import { CORRELATION_HEADER } from 'src/common/constants/headers';

@Injectable()
export class CorrelationIdentityMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction) {
    const incoming = request.get(CORRELATION_HEADER) ?? undefined; //searches only in request headers
    const correlationId: string = incoming?.trim() || generateUuidNoDashes();

    request.correlationId = correlationId;
    response.setHeader(CORRELATION_HEADER, correlationId);

    next();
  }
}
