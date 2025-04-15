import { IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TaskStatisticsParams {
  @ApiProperty({
    example: 'userId',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  childId?: string;
}
