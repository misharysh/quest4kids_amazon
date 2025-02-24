import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { TaskStatus } from "../task.model";
import { CreateTaskLabelDto } from "./create-task-label.dto";
import { Type } from "class-transformer";

export class CreateTaskDto
{
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsNotEmpty()
    @IsEnum(TaskStatus)
    status: TaskStatus;

    @IsNotEmpty()
    @IsUUID()
    userId: string;

    @IsInt()
    @IsNotEmpty()
    points: number;

    @IsOptional()
    @ValidateNested({each: true})
    @Type(() => CreateTaskLabelDto)
    labels?: CreateTaskLabelDto[];
}