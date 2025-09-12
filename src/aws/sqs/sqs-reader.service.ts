import { Injectable } from '@nestjs/common';

@Injectable()
export class SqsReaderService {
  private readonly queueUrl = process.env.SQS_QUEUE_URL!;
  private readonly waitSeconds = Number(
    process.env.SQS_POLL_WAIT_SECONDS ?? 20,
  );
  private readonly visibilityTimeout = Number(
    process.env.SQS_VISIBILITY_TIMEOUT ?? 30,
  );
  private readonly maxBatch = Math.min(
    Number(process.env.SQS_MAX_BATCH ?? 10),
    10,
  );

  private readonly queueUrls: string[] = (() => {
    const list = process.env.SQS_QUEUE_URLS;
    if (list && list.trim().length > 0) {
      return list
        .split(',')
        .map((x) => x.trim())
        .filter((x) => x.length > 0);
    }
    return this.queueUrl ? [this.queueUrl] : [];
  })();

  getReaderConfig() {
    return {
      queueUrl: this.queueUrl,
      waitSeconds: this.waitSeconds,
      visibilityTimeout: this.visibilityTimeout,
      maxBatch: this.maxBatch,
    };
  }

  getReaderConfigs() {
    return this.queueUrls.map((queueUrl) => ({
      queueUrl,
      waitSeconds: this.waitSeconds,
      visibilityTimeout: this.visibilityTimeout,
      maxBatch: this.maxBatch,
    }));
  }
}
