import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsNumber, IsString, ValidateNested } from "class-validator";

export class DashboardElementDto
{
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
    minH: number;

    @IsBoolean()
    isStatic: boolean;

    @IsBoolean()
    isVisible: boolean;
}

export class SaveDashboardDto
{
    @IsArray()
    @ValidateNested({each: true})
    @Type(() => DashboardElementDto)
    layout: DashboardElementDto[];
}