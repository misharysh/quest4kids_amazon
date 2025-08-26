import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class LoggingScope {
  context: Record<string, any> = {};
}
