import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

@ValidatorConstraint({ name: 'passwordsDependency', async: false })
export class PasswordsDependencyConstraint
  implements ValidatorConstraintInterface
{
  validate(_: any, args?: ValidationArguments) {
    const { oldPassword, password } = args?.object as any;

    if ((oldPassword && !password) || (!oldPassword && password)) {
      return false;
    }

    return true;
  }

  defaultMessage(args?: ValidationArguments) {
    return 'Both oldPassword and newPassword must be provided together';
  }
}

export class UpdateUserDto {
  @ApiProperty({
    example: 'test@gmail.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: 'Mysha Name',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: 'Qwerty1!',
    required: false,
  })
  @IsOptional()
  @Validate(PasswordsDependencyConstraint)
  @MinLength(6)
  @Matches(/[A-Z]/, { message: 'must contain at least 1 uppercase letter' })
  @Matches(/[0-9]/, { message: 'must contain at least 1 number' })
  @Matches(/[^A-Za-z0-9]/, {
    message: 'must contain at least 1 special character',
  })
  oldPassword?: string;

  @ApiProperty({
    example: 'Qwerty1!',
    required: false,
  })
  @IsOptional()
  @Validate(PasswordsDependencyConstraint)
  @MinLength(6)
  @Matches(/[A-Z]/, { message: 'must contain at least 1 uppercase letter' })
  @Matches(/[0-9]/, { message: 'must contain at least 1 number' })
  @Matches(/[^A-Za-z0-9]/, {
    message: 'must contain at least 1 special character',
  })
  password?: string;
}
