import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateTaskLabelDto
{
    @ApiProperty({
        required: true,
        example: "label"
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    name: string;
}