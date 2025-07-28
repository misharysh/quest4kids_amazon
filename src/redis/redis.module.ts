import { forwardRef, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { redisConfig } from '../config/bull.config';
import { RedisQueueService } from './redis-queue.service';
import { TasksModule } from '../tasks/tasks.module';
import { RedisCacheService } from './redis-cache.service';
import { TasksCacheInterceptor } from 'src/interceptors/tasks-cache.interceptors';

@Module({
  imports: [
    forwardRef(() => TasksModule),
    BullModule.registerQueue({
      name: 'task-statistics{queue}',
      ...redisConfig,
      defaultJobOptions: {
        removeOnComplete: false,
        removeOnFail: false,
        delay: 1000,
      },
    }),
  ],
  providers: [
    RedisQueueService,
    RedisCacheService,
    TasksCacheInterceptor  
  ],
  exports: [
    RedisQueueService,
    RedisCacheService,
    TasksCacheInterceptor
  ],
})
export class RedisModule {}
