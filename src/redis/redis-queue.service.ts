import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";

@Injectable()
export class RedisQueueService {
    constructor(
        @InjectQueue('task-statistics') private queue: Queue
    ) {};

    public async addToQueue(data: any)
    {
        console.log("Added to queue.");
        await this.queue.add('calculate-statistics', data);
    };
}