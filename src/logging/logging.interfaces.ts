import { LogLevel } from './log-level.enum';

export interface ILoggingService {
  log(level: LogLevel, message: string, properties?: object): void;
  scope(properties: Record<string, any>): void;

  info(message: string, properties?: object): void;
  warning(message: string, properties?: object): void;
  error(message: string, properties?: object): void;
  debug(message: string, properties?: object): void;
  trace(message: string, properties?: object): void;
  critical(message: string, properties?: object): void;
}

export interface ILoggingFactory {
  create(category: string): ILoggingService;
}
