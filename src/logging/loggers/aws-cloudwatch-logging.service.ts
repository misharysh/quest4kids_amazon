import { Injectable, Scope } from '@nestjs/common';
import { LoggingServiceBase } from '../logging.service.base';
import { LoggingScope } from '../logging.scope';
import { LogLevel } from '../log-level.enum';
import { AwsCloudWatchClient } from './aws/aws-cloudwatch.client';

@Injectable({ scope: Scope.TRANSIENT })
export class AwsCloudWatchLoggingService extends LoggingServiceBase {
  constructor(
    private readonly loggingScope: LoggingScope,
    private readonly category: string,
    private readonly client: AwsCloudWatchClient,
  ) {
    super();
  }

  scope(properties: Record<string, any>): void {
    this.loggingScope.context = {
      ...this.loggingScope.context,
      ...properties,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async log(
    level: LogLevel,
    message: string,
    properties?: object,
  ): Promise<void> {
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      category: this.category,
      message,
      properties: {
        ...this.loggingScope.context,
        ...(properties || {}),
      },
    };

    const str = JSON.stringify(payload);
    await this.client.push(str, Date.now());
  }
}
