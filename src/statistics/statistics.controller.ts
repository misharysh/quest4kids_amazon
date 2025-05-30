import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('ping')
  async ping(): Promise<any> {
    try {
      return await this.statisticsService.ping();
    } catch (error) {
      throw new HttpException(
        'Failed to connect to microservice:' + error.toString(),
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
