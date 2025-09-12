import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserCreatedEvent } from './user-created.event';
import { Inject } from '@nestjs/common';
import { ILoggingFactory } from '../logging/logging.interfaces';

@EventsHandler(UserCreatedEvent)
export class UserCreatedHandler implements IEventHandler<UserCreatedEvent> {
  constructor(
    @Inject('LoggingFactory')
    private readonly loggingFactory: ILoggingFactory,
  ) {}
  handle(event: UserCreatedEvent) {
    const logger = this.loggingFactory.create('UserCreatedHandler');
    const traceId = event.traceId;
    const correlationId = event.correlationId;
    const eventId = event.eventId;
    logger.scope({
      traceId,
      correlationId,
      eventId,
    });
    logger.info('User created', {
      user: event.user,
    });
  }
}
