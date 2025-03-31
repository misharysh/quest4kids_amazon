import { ApiProperty } from "@nestjs/swagger";
import { ArrayNotEmpty, IsArray, IsEnum} from "class-validator";
import { TaskLabelEnum } from "../task-label.enum";

export class TaskLabelDto
{
    @ApiProperty({
        required: true,
        example: "HOME|SCHOOL|SPORTS",
        isArray: true
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsEnum(TaskLabelEnum, { each: true })
    labels: TaskLabelEnum[];
}