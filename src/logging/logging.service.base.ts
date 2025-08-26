import { ILoggingService } from './logging.interfaces';
import { LogLevel } from './log-level.enum';

export abstract class LoggingServiceBase implements ILoggingService {
  abstract log(level: LogLevel, message: string, properties?: object): void;
  abstract scope(properties: Record<string, any>): void;

  info(message: string, properties?: object): void {
    this.log(LogLevel.info, message, properties);
  }

  warning(message: string, properties?: object): void {
    this.log(LogLevel.warning, message, properties);
  }

  error(message: string, properties?: object): void {
    this.log(LogLevel.error, message, properties);
  }

  debug(message: string, properties?: object): void {
    this.log(LogLevel.debug, message, properties);
  }

  trace(message: string, properties?: object): void {
    this.log(LogLevel.trace, message, properties);
  }

  critical(message: string, properties?: object): void {
    this.log(LogLevel.critical, message, properties);
  }
}
