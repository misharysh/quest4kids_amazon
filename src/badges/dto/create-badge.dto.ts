import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { TaskLabelEnum } from 'src/tasks/task-label.enum';

export class CreateBadgeDto {
  @ApiProperty({
    example: 'Badge Name',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 10,
    required: true,
  })
  @Type(() => Number)
  @IsInt()
  @Max(1000)
  @Min(1)
  requiredPoints: number;

  @ApiProperty({
    example: 'Music|Coding',
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(TaskLabelEnum)
  label: TaskLabelEnum;
}
