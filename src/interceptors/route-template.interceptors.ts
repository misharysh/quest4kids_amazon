import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Scope,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ILoggingFactory } from '../logging/logging.interfaces';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class RouteTemplateInterceptors implements NestInterceptor {
  constructor(
    @Inject('LoggingFactory')
    private readonly loggingFactory: ILoggingFactory,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const logger = await this.loggingFactory.create('routeRequestTemplate');

    return next.handle().pipe(
      tap((data) => {
        const routeTemplate = (request.route?.path as string) || '';
        logger.scope({
          routeTemplate: routeTemplate,
        });
      }),
    );
  }
}
