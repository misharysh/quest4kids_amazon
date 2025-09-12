import { generateUuidNoDashes } from "src/common/utils/identityGenerator";

export abstract class Event {
    correlationId: string;
    traceId: string;
    eventId: string;
    type: string;
    isRemote: boolean;

    constructor(props: Partial<Event>) {
        Object.assign(this, props);

        this.eventId = generateUuidNoDashes();
    }
}