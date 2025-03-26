import { IsEnum, IsIn, IsOptional, IsString, IsUUID, MinLength } from "class-validator";
import { TaskStatus } from "../task.model";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class FindTaskParams 
{
    @ApiProperty({
        example: "OPEN|IN_PROGRESS|DONE",
        required: false
    })
    @IsOptional()
    @IsEnum(TaskStatus)
    status?: TaskStatus;

    @ApiProperty({
        example: "task",
        required: false
    })
    @IsOptional()
    @MinLength(3)
    @IsString()
    search?: string;

    @ApiProperty({
        example: "userId",
        required: false
    })
    @IsOptional()
    @IsUUID()
    childId?: string;

    @ApiProperty({
        example: "comma separated labels",
        required: false
    })
    @IsOptional()
    @Transform(({value}: {value?: string}) => {
        if(!value) return undefined;

        return value.split(',').map((label) => label.trim()).filter((label) => label.length);
    })
    labels?: string[];

    @ApiProperty({
        example: "'createdAt'|'title'|'status'",
        required: false,
        default: "createdAt"
    })
    @IsOptional()
    @IsIn(['createdAt', 'title', 'status'])
    sortBy?: string = 'createdAt';

    @ApiProperty({
        example: "'ASC'|'DESC'",
        required: false,
        default: 'DESC'
    })
    @IsOptional()
    @IsEnum(['ASC' , 'DESC'])
    sortOrder?: 'ASC' | 'DESC' = 'DESC';
}