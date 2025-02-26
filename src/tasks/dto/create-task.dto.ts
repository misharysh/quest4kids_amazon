import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { TaskStatus } from "../task.model";
import { CreateTaskLabelDto } from "./create-task-label.dto";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class CreateTaskDto
{
    @ApiProperty({
        example: "Title Name",
        required: true
    })
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiProperty({
        example: "Title Description",
        required: true
    })
    @IsNotEmpty()
    @IsString()
    description: string;

    @ApiProperty({
        example: "OPEN|IN_PROGRESS|DONE",
        required: true
    })
    @IsNotEmpty()
    @IsEnum(TaskStatus)
    status: TaskStatus;

    
    userId: string;

    @ApiProperty({
        example: 5,
        required: false
    })
    @IsInt()
    @IsOptional()
    points?: number;

    @ApiProperty({
        example: "[{'name': 'Mysha label'}]",
        required: false
    })
    @IsOptional()
    @ValidateNested({each: true})
    @Type(() => CreateTaskLabelDto)
    labels?: CreateTaskLabelDto[];
}