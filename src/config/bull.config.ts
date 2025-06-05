import { QueueOptions } from 'bullmq';
import * as dotenv from 'dotenv';
dotenv.config();

export const redisConfig: QueueOptions = {
    connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10)
    },
};