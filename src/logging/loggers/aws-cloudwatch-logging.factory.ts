import { Injectable, Scope } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ILoggingFactory, ILoggingService } from '../logging.interfaces';
import { LoggingScope } from '../logging.scope';
import { AwsCloudWatchLoggingService } from './aws-cloudwatch-logging.service';
import { AwsCloudWatchClient } from './aws/aws-cloudwatch.client';

@Injectable({ scope: Scope.REQUEST })
export class AwsCloudWatchLoggingFactory implements ILoggingFactory {
  constructor(
    private readonly loggingScope: LoggingScope,
    private readonly moduleRef: ModuleRef,
  ) {}

  create(category: string): ILoggingService {
    const client = this.moduleRef.get(AwsCloudWatchClient, { strict: false });
    return new AwsCloudWatchLoggingService(this.loggingScope, category, client);
  }
}
