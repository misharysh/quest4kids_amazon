import { forwardRef, Module } from "@nestjs/common";
import { BullModule } from '@nestjs/bullmq';
import { redisConfig } from "../config/bull.config";
import { RedisQueueService } from "./redis-queue.service";
import { TasksModule } from "../tasks/tasks.module";

@Module({
    imports: [
        forwardRef(() => TasksModule),
        BullModule.registerQueue({
            name: 'task-statistics{queue}',
            ...redisConfig,
            defaultJobOptions: {
                removeOnComplete: false,
                removeOnFail: false,
                delay: 1000
            },
        }),
    ],
    providers: [RedisQueueService],
    exports: [RedisQueueService]
})
export class RedisModule {}