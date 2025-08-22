import { ILoggingService } from './logging.interfaces';
import { LogLevel } from './log-level.enum';

export abstract class ExtendedLoggingService implements ILoggingService {
  constructor(private readonly base: ILoggingService) {}

  log(level: LogLevel, message: string, properties?: object): void {
    this.base.log(level, message, properties);
  }

  scope(properties: Record<string, any>): void {
    this.base.scope(properties);
  }

  setCategory(category: string): void {
    this.base.setCategory(category);
  }

  logInfo(message: string, properties?: object): void {
    this.log(LogLevel.info, message, properties);
  }

  logWarn(message: string, properties?: object): void {
    this.log(LogLevel.warning, message, properties);
  }

  logError(message: string, properties?: object): void {
    this.log(LogLevel.error, message, properties);
  }

  logDebug(message: string, properties?: object): void {
    this.log(LogLevel.debug, message, properties);
  }

  logTrace(message: string, properties?: object): void {
    this.log(LogLevel.trace, message, properties);
  }

  logCritical(message: string, properties?: object): void {
    this.log(LogLevel.critical, message, properties);
  }
}
