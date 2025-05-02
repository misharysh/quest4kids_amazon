import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";

export class MessageParams {
    @ApiProperty({
        example: 'userId',
        required: true,
    })
    @IsNotEmpty()
    @IsUUID()
    withUserId: string;
}