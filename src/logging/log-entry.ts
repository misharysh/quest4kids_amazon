import { LogLevel } from './log-level.enum';

export class LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  properties?: object;
}
