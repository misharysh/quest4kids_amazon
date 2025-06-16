import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class StatisticsService implements OnModuleInit {
  constructor(@Inject('COMMUNICATION') private readonly client: ClientProxy) {}

  async onModuleInit() {
    try {
      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to STATISTICS service:', error);
    }
  }

  async ping(): Promise<any> {
    return await this.client.send('ping', {}).toPromise();
  }

  async getLatestReport(): Promise<any> {
    return await this.client.send('get-latest-report', {}).toPromise();
  }
}
