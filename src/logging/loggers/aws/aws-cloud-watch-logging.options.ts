export interface AwsCloudWatchLoggingOptions {
  logGroupName: string;
  logStreamName: string;
  region?: string;

  flushIntervalMs?: number;
  maxBatchSize?: number;
  maxBatchBytes?: number;
  retentionInDays?: number;
}

export const AWS_CLOUDWATCH_LOGGING_OPTIONS = Symbol(
  'AWS_CLOUDWATCH_LOGGING_OPTIONS',
);
