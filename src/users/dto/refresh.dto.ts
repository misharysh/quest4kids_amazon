import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshDto {
  @ApiProperty({
    example: '12345',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
