import { InjectRepository } from "@nestjs/typeorm";
import { ILoggingService } from "../logging.interfaces";
import { DatabaseLogEntity } from "../database-logging.entity";
import { Repository } from "typeorm";
import { LogLevel } from "../log-level.enum";
import { Injectable, Scope } from "@nestjs/common";

@Injectable({scope: Scope.REQUEST})
export class DatabaseLoggingService implements ILoggingService
{
    private context: Record<string,any> = {}
    private category = '';

    constructor(
        @InjectRepository(DatabaseLogEntity)
        private readonly logRepo: Repository<DatabaseLogEntity>,
    ) {}

    setCategory(category: string) {
        this.category = category;
    }
    
    scope(properties: Record<string, any>): void {
        this.context = {...this.context, ...properties};
    }

    async log(level: LogLevel, message: string, properties?: object): Promise<void> {
        const entry = this.logRepo.create({
            level,
            category: this.category,
            message,
            properties: {
                ...this.context,      
                ...(properties || {}),
            },
        });

        await this.logRepo.save(entry);
    }
;
}