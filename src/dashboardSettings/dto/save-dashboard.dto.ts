import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';

export class DashboardElementDto {
  @IsString()
  i: string;

  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  @IsNumber()
  w: number;

  @IsNumber()
  h: number;

  @IsNumber()
  minH?: number;

  @IsNumber()
  maxH?: number;

  @IsNumber()
  minW?: number;

  @IsNumber()
  maxW?: number;

  @IsBoolean()
  static: boolean;

  @IsBoolean()
  moved: boolean;

  @IsBoolean()
  isResizable: boolean;

  @IsBoolean()
  isDraggable: boolean;

  @IsBoolean()
  isVisible: boolean;
}

export class SaveDashboardDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DashboardElementDto)
  layout: DashboardElementDto[];
}
