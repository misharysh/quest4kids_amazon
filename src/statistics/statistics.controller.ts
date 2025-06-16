import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

interface ReportResponse {
  filename: string;
  content: string;
  created: string;
}

@ApiTags('Statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @ApiOperation({ summary: 'Ping statistics microservice' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Microservice is alive',
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'Microservice is not available',
  })
  @Get('ping')
  async ping(): Promise<{ status: string }> {
    try {
      return await this.statisticsService.ping();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        `Failed to connect to microservice: ${errorMessage}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @ApiOperation({ summary: 'Get latest statistics report' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the latest report',
    type: Object,
    schema: {
      properties: {
        filename: { type: 'string' },
        content: { type: 'string' },
        created: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to get report',
  })
  @Get('latest-report')
  async getLatestReport(): Promise<ReportResponse> {
    try {
      return await this.statisticsService.getLatestReport();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        `Failed to get latest report: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
