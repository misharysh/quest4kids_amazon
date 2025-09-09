import { IEventHandler } from "@nestjs/cqrs";
import { AmazonSnsEventBus } from "./amazon-sns.event-bus";
import { Event } from "./event";

export class RemoteEventHandler<T extends Event> implements IEventHandler<T> {
    constructor(private readonly remoteBus: AmazonSnsEventBus) {}
    
    async handle(event: T) {
        if (event.isRemote)
        {
            await this.remoteBus.raise(event);
        }
    }
}