import { Event } from "./event";

export interface IRemoteEventBus {
    raise<TEvent extends Event>(event: TEvent): Promise<void>;
}
