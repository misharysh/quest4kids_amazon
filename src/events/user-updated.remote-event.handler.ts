import { EventsHandler } from "@nestjs/cqrs";
import { AmazonSnsEventBus } from "./amazon-sns.event-bus";
import { RemoteEventHandler } from "./remote-event.handler";
import { UserUpdatedEvent } from "./user-updated.event";

@EventsHandler(UserUpdatedEvent)
export class UserUpdatedRemoteEventHandler extends RemoteEventHandler<UserUpdatedEvent> {
    constructor(remoteBus: AmazonSnsEventBus) {
        super(remoteBus);
    }
}