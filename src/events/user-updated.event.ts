import { User } from "src/users/user.entity";
import { Event } from "./event";

export class UserUpdatedEvent extends Event {
    user: User;
    type = 'event:user.updated';
    isRemote = true;

    constructor(user: User, context: {traceId: string; correlationId: string})
    {
        super({traceId: context.traceId, correlationId: context.correlationId});
        this.user = user;
    }
}