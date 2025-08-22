import { LogLevel } from './log-level.enum';

export interface ILoggingService
{
    log(level: LogLevel, message: string, properties?: object): void;
    scope(properties: Record<string, any>): void;
}

export interface ILoggingFactory
{
    create(category: string): Promise<ILoggingService>;
}
