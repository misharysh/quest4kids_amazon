import { IEvent } from '@nestjs/cqrs';

export class ArrivedUserCreatedEvent implements IEvent {
  constructor(
    public readonly user: object,
    public readonly traceId: string,
    public readonly correlationId: string,
    public readonly eventId: string,
  ) {}
}
