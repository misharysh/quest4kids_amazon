import { Injectable, Scope } from "@nestjs/common";
import { ILoggingFactory, ILoggingService } from "./logging.interfaces";
import { ConsoleLoggingService } from "./loggers/console-logging.service";
import { DatabaseLoggingService } from "./loggers/database-logging.service";

@Injectable({scope: Scope.REQUEST})
export class LoggingFactory implements ILoggingFactory{
    private loggers = new Map<string, ILoggingService>();

    constructor(
        private readonly consoleLogger: ConsoleLoggingService,
        private readonly databaseLogger: DatabaseLoggingService
    ) {}

    create(category: string, type: "console" | "database" = 'console'): ILoggingService {
        if (this.loggers.has(category)) {
            return this.loggers.get(category)!;
        }

        const logger =
            type === "console" ? this.consoleLogger : this.databaseLogger;

        logger.setCategory(category);

        return logger;
    }
}