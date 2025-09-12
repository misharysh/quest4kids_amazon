import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { SqsReaderService } from './sqs-reader.service';
import { EventFactory } from '../../events/event-factory';
import { EventBus } from '@nestjs/cqrs';
import {
  getLoggingFactoryFromAls,
  setLoggingFactoryForCurrentAsyncChain,
} from '../../logging/logging-factory.context';
import { ContextIdFactory, ModuleRef } from '@nestjs/core';
import { ILoggingFactory } from '../../logging/logging.interfaces';
import { Consumer } from 'sqs-consumer';
import type {
  SQSClient,
  Message,
  MessageAttributeValue,
} from '@aws-sdk/client-sqs';
import { OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class SqsConsumer implements OnModuleInit, OnModuleDestroy {
  private app?: Consumer;
  private apps: Consumer[] = [];

  constructor(
    private readonly sqsReader: SqsReaderService,
    private readonly eventBus: EventBus,
    private readonly eventFactory: EventFactory,
    private readonly moduleRef: ModuleRef,
    @Inject('SQS_CLIENT') private readonly sqsClient: SQSClient,
  ) {}

  async onModuleInit() {
    const logger = await this.getLogger();
    const configs = this.sqsReader.getReaderConfigs();
    // const { queueUrl, waitSeconds, visibilityTimeout, maxBatch } =
    //   this.sqsReader.getReaderConfig();
    if (!configs.length) {
      logger.error(
        'No SQS queue URLs configured (SQS_QUEUE_URL or SQS_QUEUE_URLS)',
      );
      return;
    }

    for (const cfg of configs) {
      const { queueUrl, waitSeconds, visibilityTimeout, maxBatch } = cfg;

      const app = Consumer.create({
        queueUrl,
        sqs: this.sqsClient,
        waitTimeSeconds: waitSeconds,
        visibilityTimeout,
        batchSize: maxBatch,
        handleMessage: async (m) => this.processMessage(queueUrl, m),
      });

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      app.on('error', async (err) => {
        const l = await this.getLogger();
        l.error(`SQS Consumer error [${queueUrl}]: ${err.stack}`);
      });

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      app.on('processing_error', async (err) => {
        const l = await this.getLogger();
        l.error(`SQS Consumer processing error [${queueUrl}]: ${err.stack}`);
      });

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      app.on('message_received', async (msg) => {
        const l = await this.getLogger();
        l.debug('SQS message received', {
          queueUrl,
          id: msg.MessageId,
          attributes: msg.Attributes,
        });
      });

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      app.on('message_processed', async (msg) => {
        const l = await this.getLogger();
        l.debug('SQS message processed', { queueUrl, id: msg.MessageId });
      });

      logger.info(
        `SQS Consumer starting: url=${queueUrl}, batch=${maxBatch}, wait=${waitSeconds}s, visibility=${visibilityTimeout}s`,
      );

      app.start();
      this.apps.push(app);
      // сохраняем для обратной совместимости, если где-то обращаются к this.app
      this.app = this.app ?? app;
    }
  }

  onModuleDestroy() {
    for (const app of this.apps) {
      try {
        app.stop();
      } catch {
        // ignore
      }
    }
  }

  @Interval(10000)
  poll() {
    return;
  }

  private async processMessage(queueUrl: string, m: Message) {
    const logger = await this.getLogger();
    const id = m.MessageId!;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const parsed = safeJsonParse(m.Body);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const snsMsg = this.getSNSMessage(m);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const envelope =
        snsMsg ??
        (parsed && typeof parsed === 'object' && 'type' in (parsed as any)
          ? parsed
          : undefined);
      if (!envelope) {
        throw new Error('Incoming message is not a valid object/JSON');
      }

      const traceId = (snsMsg as any)?.traceId as string | undefined;
      const correlationId = (snsMsg as any)?.correlationId as string | undefined;
      const eventId = (snsMsg as any)?.eventId as string | undefined;

      logger.scope({
        traceId,
        correlationId,
        eventId,
      });

      logger.info('SQS Message Received', {
        queueUrl,
        message_id: id,
        attributes: m.Attributes,
        message_attributes: mapMsgAttributes(m.MessageAttributes),
        body: serializeForLog(parsed),
      });

      const { event } = this.eventFactory.create(envelope);
      this.eventBus.publish(event);

      // success: sqs-consumer will delete the message automatically
    } catch (err) {
      // throw to signal failure; sqs-consumer will NOT delete the message
      logger.error(
        `Failed to process ${id}: ${err instanceof Error ? err.stack : err}`,
      );
      throw err instanceof Error ? err : new Error(String(err));
    }
  }

  async getLogger() {
    let factory = getLoggingFactoryFromAls();
    if (!factory) {
      const contextId = ContextIdFactory.create();
      factory = await this.moduleRef.resolve<ILoggingFactory>(
        'LoggingFactory' as any,
        contextId,
        { strict: false },
      );
      setLoggingFactoryForCurrentAsyncChain(factory);
    }

    return factory.create('sqsReader');
  }
  getSNSMessage(m: Message) {
    // 1) Parse the body of the SQS message
    const parsed = safeJsonParse(m.Body);
    const bodyObj = typeof parsed === 'string' ? safeJsonParse(parsed) : parsed;

    // 2) Classic SNS → SQS: top-level Message field is a string with JSON
    const topLevelMessage = (bodyObj as any)?.Message;
    if (typeof topLevelMessage === 'string') {
      return safeJsonParse(topLevelMessage);
    }

    // 3) Option with Lambda proxy wrapper (as it was before)
    const snsMsgRaw =
      (bodyObj as any)?.requestPayload?.Records?.[0]?.Sns?.Message ??
      (bodyObj as any)?.responsePayload?.Message;

    return typeof snsMsgRaw === 'string' ? safeJsonParse(snsMsgRaw) : undefined;
  }
}

function safeJsonParse(text?: string | null) {
  if (!text) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function serializeForLog(value: any) {
  try {
    return typeof value === 'string' ? value : JSON.stringify(value ?? '');
  } catch {
    return '';
  }
}

function mapMsgAttributes(attrs?: Record<string, MessageAttributeValue>) {
  if (!attrs) return undefined;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(attrs)) {
    out[k] = {
      dataType: v.DataType,
      stringValue: v.StringValue,
      binaryValue: v.BinaryValue ? '[binary]' : undefined,
    };
  }
  return out;
}
