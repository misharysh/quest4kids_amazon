import { IsString } from 'class-validator';

export class GenerateTaskDto {
  @IsString()
  prompt: string;
}
