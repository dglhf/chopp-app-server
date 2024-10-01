import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, IsEmail } from 'class-validator';

const PASSWORD_MINIMAL_LENGTH = 8;
const PASSWORD_MAXIMUM_LENGTH = 16;

export class AuthDto {
    @ApiProperty({ example: 'user@gmail.com', description: 'unique email' })
    @IsString({ message: 'STRING field type expected' })
    @IsEmail({}, { message: 'Field must be email' })
    readonly email: string;

    @ApiProperty({ example: '1234', description: 'password' })
    @IsString({ message: 'STRING field type expected' })
    @Length(PASSWORD_MINIMAL_LENGTH, PASSWORD_MAXIMUM_LENGTH, { message: `Password must be from ${PASSWORD_MINIMAL_LENGTH} to ${PASSWORD_MAXIMUM_LENGTH} characters` })
    readonly password: string;
}

export class RefreshDto {
    @ApiProperty({ example: 'asdd334safs', description: 'refresh token' })
    @IsString({ message: 'STRING field type expected' })
    readonly refreshToken: string;
}