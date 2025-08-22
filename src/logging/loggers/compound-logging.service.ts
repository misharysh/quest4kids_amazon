import { Injectable, Scope } from "@nestjs/common";
import { LogLevel } from "../log-level.enum";
import { ILoggingService } from "../logging.interfaces";
import { LoggingScope } from "../logging.scope";

@Injectable({scope: Scope.TRANSIENT})
export class CompoundLoggingService implements ILoggingService {
    constructor(
        private readonly loggingScope: LoggingScope,
        private readonly services: ILoggingService[],
    ) {}

    scope(properties: Record<string, any>): void {
        this.loggingScope.context = {
            ...this.loggingScope.context,
            ...properties,
        };
    }
    

    log(level: LogLevel, message: string, properties?: object): void {
        this.services.forEach(s => s.log(level, message, properties));
    }
    
}