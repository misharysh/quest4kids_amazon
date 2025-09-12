import { Global, Module } from '@nestjs/common';
import { SQSClient } from '@aws-sdk/client-sqs';

@Global()
@Module({
  providers: [
    {
      provide: 'SQS_CLIENT',
      useFactory: () => {
        const region = process.env.AWS_REGION || 'eu-central-1';
        const endpoint = process.env.SQS_ENDPOINT;

        const accessKeyId =
          process.env.AWS_ACCESS_KEY_ID || process.env.AMAZON_ACCESS_KEY_ID;
        const secretAccessKey =
          process.env.AWS_SECRET_ACCESS_KEY ||
          process.env.AMAZON_SECRET_ACCESS_KEY;

        const credentials = endpoint
          ? {
              accessKeyId: accessKeyId || 'test',
              secretAccessKey: secretAccessKey || 'test',
            }
          : accessKeyId && secretAccessKey
            ? { accessKeyId, secretAccessKey }
            : undefined;

        return new SQSClient({
          region,
          endpoint: endpoint || undefined,
          credentials,
        });
      },
    },
  ],
  exports: ['SQS_CLIENT'],
})
export class SqsModule {}
