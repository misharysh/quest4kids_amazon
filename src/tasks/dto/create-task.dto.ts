import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { TaskStatus } from '../task.model';
import { ApiProperty } from '@nestjs/swagger';
import { TaskLabelEnum } from '../task-label.enum';

export class CreateTaskDto {
  @ApiProperty({
    example: 'Title Name',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Title Description',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    example: 'OPEN|IN_PROGRESS|DONE',
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(TaskStatus)
  status: TaskStatus;

  userId: string;

  @ApiProperty({
    example: 5,
    required: false,
  })
  @IsInt()
  @IsOptional()
  points?: number;

  @ApiProperty({
    example: ['HOME', 'SCHOOL'],
    isArray: true,
    enum: TaskLabelEnum,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(TaskLabelEnum, { each: true })
  labels?: TaskLabelEnum[];

  @ApiProperty({
    example: 30,
    required: false,
  })
  @IsInt()
  @IsOptional()
  estimatedTime?: number;

  @ApiProperty({
    example: 0,
    required: false,
  })
  @IsInt()
  @IsOptional()
  actualTime?: number;

  @ApiProperty({
    example: 'Task Comment',
    required: false,
  })
  @IsOptional()
  @IsString()
  comment: string;
}
