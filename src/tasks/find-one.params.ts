import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class FindOneParams {
  @ApiProperty({
    required: true,
    example: "id"
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  id: string;
}