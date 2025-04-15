import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class PointsDto {
  @ApiProperty({
    example: 5,
    required: true,
  })
  @IsInt()
  exchangePoints: number;
}
