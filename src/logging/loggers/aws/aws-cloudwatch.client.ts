import { Injectable, Inject, OnModuleDestroy, Logger } from '@nestjs/common';
import * as AWS from 'aws-sdk';

import {
  AWS_CLOUDWATCH_LOGGING_OPTIONS,
  AwsCloudWatchLoggingOptions,
} from './aws-cloud-watch-logging.options';

type InputLogEvent = AWS.CloudWatchLogs.InputLogEvent;

@Injectable()
export class AwsCloudWatchClient implements OnModuleDestroy {
  private readonly cw: AWS.CloudWatchLogs;
  private readonly group: string;
  private readonly stream: string;

  private sequenceToken?: string;
  private initialized = false;

  private buffer: InputLogEvent[] = [];
  private timer?: NodeJS.Timeout;

  private readonly flushIntervalMs: number;
  private readonly maxBatchSize: number;
  private readonly maxBatchBytes: number;
  private readonly retentionInDays?: number;

  private readonly logger = new Logger(AwsCloudWatchClient.name);

  constructor(
    @Inject(AWS_CLOUDWATCH_LOGGING_OPTIONS)
    private readonly opts: AwsCloudWatchLoggingOptions,
  ) {
    this.group = opts.logGroupName;
    this.stream = opts.logStreamName;
    this.flushIntervalMs = opts.flushIntervalMs ?? 2000;
    this.maxBatchSize = Math.min(opts.maxBatchSize ?? 10000, 10000);
    this.maxBatchBytes = Math.min(opts.maxBatchBytes ?? 960000, 1048576);
    this.retentionInDays = opts.retentionInDays;

    const maybeCredentials =
      process.env.AMAZON_ACCESS_KEY_ID && process.env.AMAZON_SECRET_ACCESS_KEY
        ? new AWS.Credentials({
            accessKeyId: process.env.AMAZON_ACCESS_KEY_ID,
            secretAccessKey: process.env.AMAZON_SECRET_ACCESS_KEY,
          })
        : undefined;

    this.cw = new AWS.CloudWatchLogs({
      region: opts.region ?? process.env.AWS_REGION,
      credentials: maybeCredentials,
    });

    this.startTimer();
  }

  async push(message: string, timestamp: number) {
    await this.ensureInitialized();
    this.buffer.push({ message, timestamp });

    if (this.buffer.length >= this.maxBatchSize) {
      this.flush().catch((e) =>
        this.logger.warn(`CloudWatch flush error: ${e?.message ?? e}`),
      );
    }
  }

  async onModuleDestroy() {
    await this.flush();
    if (this.timer) clearInterval(this.timer);
  }

  private startTimer() {
    this.timer = setInterval(() => {
      this.flush().catch(() => void 0);
    }, this.flushIntervalMs);
  }

  private async ensureInitialized() {
    if (this.initialized) return;

    try {
      await this.createLogGroupIfNotExists();
      await this.createLogStreamIfNotExists();
      await this.refreshSequenceToken();
      this.initialized = true;
    } catch (e) {
      this.logger.error(`CloudWatch init error`, e);
      throw e;
    }
  }

  private async createLogGroupIfNotExists() {
    try {
      await this.cw.createLogGroup({ logGroupName: this.group }).promise();
    } catch (e: any) {
      if (e?.code !== 'ResourceAlreadyExistsException') {
        throw e;
      }
    }

    if (this.retentionInDays) {
      await this.putRetentionPolicyWithRetry(this.retentionInDays).catch(
        (e: any) => {
          this.logger.warn(`Failed to set retention: ${e?.message ?? e}`);
        },
      );
    }
  }

  private async putRetentionPolicyWithRetry(
    retentionInDays: number,
    attempts = 5,
  ): Promise<void> {
    let lastError: any;
    for (let i = 1; i <= attempts; i++) {
      try {
        await this.cw
          .putRetentionPolicy({
            logGroupName: this.group,
            retentionInDays,
          })
          .promise();
        return;
      } catch (e: any) {
        lastError = e;
        const isConflict =
          e?.code === 'OperationAbortedException' ||
          e?.code === 'ConcurrentModificationException' ||
          (typeof e?.message === 'string' &&
            e.message.includes('conflicting operation'));
        if (!isConflict) {
          throw e;
        }
        const delay = Math.min(1000 * 2 ** (i - 1), 8000);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw lastError;
  }

  private async createLogStreamIfNotExists() {
    try {
      await this.cw
        .createLogStream({
          logGroupName: this.group,
          logStreamName: this.stream,
        })
        .promise();
    } catch (e: any) {
      if (e?.code !== 'ResourceAlreadyExistsException') {
        throw e;
      }
    }
  }

  private async refreshSequenceToken() {
    const res = await this.cw
      .describeLogStreams({
        logGroupName: this.group,
        logStreamNamePrefix: this.stream,
      })
      .promise();

    const stream = res.logStreams?.find((s) => s.logStreamName === this.stream);
    this.sequenceToken = stream?.uploadSequenceToken;
  }

  private async flush() {
    if (this.buffer.length === 0) return;

    let size = 0;
    const events: InputLogEvent[] = [];
    while (this.buffer.length > 0 && events.length < this.maxBatchSize) {
      const next = this.buffer[0];
      const approx = Buffer.byteLength(next.message, 'utf8') + 26;
      if (size + approx > this.maxBatchBytes) break;
      events.push(next);
      size += approx;
      this.buffer.shift();
    }

    events.sort((a, b) => a.timestamp - b.timestamp);

    try {
      const res = await this.cw
        .putLogEvents({
          logGroupName: this.group,
          logStreamName: this.stream,
          logEvents: events,
          sequenceToken: this.sequenceToken,
        })
        .promise();

      this.sequenceToken = res.nextSequenceToken;
    } catch (e: any) {
      if (e?.code === 'InvalidSequenceTokenException') {
        await this.refreshSequenceToken();
        this.buffer = events.concat(this.buffer);
      } else if (e?.code === 'DataAlreadyAcceptedException') {
        await this.refreshSequenceToken();
      } else {
        this.logger.warn(`PutLogEvents failed: ${e?.message ?? e}`);
        this.buffer = events.concat(this.buffer);
      }
    }
  }
}
