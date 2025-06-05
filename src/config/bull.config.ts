import { QueueOptions } from 'bullmq';

export const redisConfig: QueueOptions = {
    connection: {
        host: 'localhost',
        port: 6379
    },
};