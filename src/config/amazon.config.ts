import { registerAs } from '@nestjs/config';

export interface AmazonConfig {
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

export const amazonConfig = registerAs(
  'amazon',
  (): AmazonConfig => ({
    accessKeyId: process.env.AMAZON_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AMAZON_SECRET_ACCESS_KEY ?? '',
    bucket: process.env.AMAZON_BUCKET as string,
  }),
);
