import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ILoggingFactory } from '../logging/logging.interfaces';
import { ArrivedUserCreatedEvent } from './arrived-user-created.event';

@EventsHandler(ArrivedUserCreatedEvent)
export class ArrivedUserCreatedHandler
  implements IEventHandler<ArrivedUserCreatedEvent>
{
  constructor(
    @Inject('LoggingFactory')
    private readonly loggingFactory: ILoggingFactory,
  ) {}
  handle(event: ArrivedUserCreatedEvent) {
    const logger = this.loggingFactory.create('ArrivedUserCreatedHandler');
    const traceId = event.traceId;
    const correlationId = event.correlationId;
    const eventId = event.eventId;
    logger.scope({
      traceId,
      correlationId,
      eventId,
    });
    logger.info('[ArrivedUserCreatedHandler] User created', {
      user: event.user,
    });
  }
}
