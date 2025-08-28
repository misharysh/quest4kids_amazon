import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { generateUuidNoDashes } from 'src/common/utils/identityGenerator';
import { TRACE_HEADER } from 'src/common/constants/headers';

@Injectable()
export class TraceIdentityMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction) {
    const traceId = generateUuidNoDashes();

    request.traceId = traceId;
    response.setHeader(TRACE_HEADER, traceId);

    next();
  }
}
