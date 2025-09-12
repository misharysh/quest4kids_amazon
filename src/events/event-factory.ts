import { Injectable } from '@nestjs/common';
import { IEvent } from '@nestjs/cqrs';
import { UserCreatedEvent } from './user-created.event';

export interface ExternalEventEnvelope {
  type: string;
  [key: string]: any;
}

export type EventCreator<TEvent extends IEvent = IEvent> = (
  envelope: ExternalEventEnvelope,
) => TEvent;

@Injectable()
export class EventFactory {
  private readonly creators = new Map<string, EventCreator>();

  constructor() {
    this.register(
      'event:user.created',
      (e) =>
        new UserCreatedEvent(
          e.user as object,
          e.traceId,
          e.correlationId,
          e.eventId,
        ),
    );
  }

  register(type: string, creator: EventCreator) {
    const key = this.normalizeType(type);
    this.creators.set(key, creator);
  }

  create(raw: unknown): { event: IEvent; envelope: ExternalEventEnvelope } {
    const envelope = this.toEnvelope(raw);
    const key = this.normalizeType(envelope.type);
    const creator = this.creators.get(key);

    if (creator) {
      return { event: creator(envelope), envelope };
    }

    throw new Error('Unknown External Event');
  }

  private toEnvelope(raw: unknown): ExternalEventEnvelope {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const obj = typeof raw === 'string' ? this.safeJsonParse(raw) : raw;
    if (!obj || typeof obj !== 'object') {
      throw new Error('Incoming message is not a valid object/JSON');
    }
    const envelope = obj as Record<string, any>;
    const type = envelope.type as string;
    if (!type || typeof type !== 'string') {
      throw new Error(
        'Incoming message does not contain a string "type" field',
      );
    }
    return envelope as ExternalEventEnvelope;
  }

  private safeJsonParse(text: string) {
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('Incoming message is not valid JSON');
    }
  }

  private normalizeType(type: string) {
    return type.trim().toLowerCase();
  }
}
