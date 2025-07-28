import { Injectable } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisCacheService
{
    private readonly redisClient: Redis;

    constructor()
    {
        this.redisClient = new Redis();
    }

    async get(key:string): Promise<string|null>
    {
        return await this.redisClient.get(key);
    }

    async set(key:string, value:string, ttlSeconds:number): Promise<void>
    {
        await this.redisClient.set(key,value, 'EX', ttlSeconds);
    }

    async del(key: string): Promise<void>
    {
        await this.redisClient.del(key);
    }
}