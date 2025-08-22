import { Injectable, Scope } from "@nestjs/common";
import { CompoundLoggingService } from "./compound-logging.service";
import { ILoggingFactory, ILoggingService } from "../logging.interfaces";
import { LoggingScope } from "../logging.scope";

@Injectable({scope: Scope.REQUEST})
export class CompoundLoggingFactory implements ILoggingFactory {

    constructor(
        private readonly loggingScope: LoggingScope,
        private readonly factories: ILoggingFactory[],
    ) {}

    async create(category: string): Promise<ILoggingService> {
        const services: ILoggingService[] = [];

        for (const factory of this.factories)
        {
            const logger = await factory.create(category);
            services.push(logger);
        }

        return new CompoundLoggingService(this.loggingScope, services);
    }
}