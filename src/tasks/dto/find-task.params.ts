import {
  IsArray,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { TaskStatus } from '../task.model';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TaskLabelEnum } from '../task-label.enum';

export class FindTaskParams {
  @ApiProperty({
    example: 'OPEN|IN_PROGRESS|DONE',
    required: false,
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiProperty({
    example: 'task',
    required: false,
  })
  @IsOptional()
  @MinLength(3)
  @IsString()
  search?: string;

  @ApiProperty({
    example: 'userId',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  childId?: string;

  @ApiProperty({
    example: 'comma separated labels',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;

    return value
      .split(',')
      .map((label) => label.trim())
      .map(
        (label) => label.charAt(0).toUpperCase() + label.slice(1).toLowerCase(),
      )
      .filter((label) => label.length);
  })
  @IsArray()
  @IsEnum(TaskLabelEnum, { each: true })
  labels?: TaskLabelEnum[];

  @ApiProperty({
    example: "'createdAt'|'updatedAt'|'title'|'status'",
    required: false,
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'title', 'status'])
  sortBy?: string = 'createdAt';

  @ApiProperty({
    example: "'asc'|'desc'",
    required: false,
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  @Transform(({ value }) => value?.toUpperCase())
  sortOrder?: 'asc' | 'desc' = 'desc';
}
