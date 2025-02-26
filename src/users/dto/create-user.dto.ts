import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, Matches, MinLength } from "class-validator";

export class CreateUserDto
{
    @ApiProperty({
        example: "test@gmail.com",
        required: true
    })
    @IsEmail()
    email:string;
    
    @ApiProperty({
        example: "Mysha Name",
        required: true
    })
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        example: "Qwerty1!",
        required: true
    })
    @IsNotEmpty()
    @MinLength(6)
    @Matches(/[A-Z]/, {message: 'must contain at least 1 uppercase letter'})
    @Matches(/[0-9]/, {message: 'must contain at least 1 number'})
    @Matches(/[^A-Za-z0-9]/, {message: 'must contain at least 1 special character'})
    password: string;
}