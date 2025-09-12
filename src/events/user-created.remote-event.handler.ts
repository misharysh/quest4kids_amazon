import { EventsHandler } from "@nestjs/cqrs";
import { AmazonSnsEventBus } from "./amazon-sns.event-bus";
import { RemoteEventHandler } from "./remote-event.handler";
import { UserCreatedEvent } from "./user-created.event";

@EventsHandler(UserCreatedEvent)
export class UserCreatedRemoteEventHandler extends RemoteEventHandler<UserCreatedEvent> {
    constructor(remoteBus: AmazonSnsEventBus) {
        super(remoteBus);
    }
}