import { IsEmail, IsString, MinLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'john_doe' })
    @IsOptional()
    @IsString()
    @Matches(/^[a-zA-Z0-9_]+$/, {
        message: 'Username hanya boleh berisi huruf, angka, dan underscore',
    })
    username?: string;

    @ApiProperty({ example: 'john@example.com' })
    @IsEmail({}, { message: 'Format email tidak valid' })
    email: string;

    @ApiProperty({ example: 'password123' })
    @IsString()
    @MinLength(8, { message: 'Password minimal 8 karakter' })
    password: string;

    @ApiProperty({ example: 'John Doe' })
    @IsString()
    @MinLength(2, { message: 'Nama lengkap minimal 2 karakter' })
    fullName: string;

    @ApiPropertyOptional({ example: '08123456789' })
    @IsOptional()
    @IsString()
    @Matches(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, {
        message: 'Format nomor telepon tidak valid',
    })
    phone?: string;
}

export class LoginDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail({}, { message: 'Format email tidak valid' })
    email: string;

    @ApiProperty({ example: 'password123' })
    @IsString()
    @MinLength(1, { message: 'Password wajib diisi' })
    password: string;
}

export class ForgotPasswordDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail({}, { message: 'Format email tidak valid' })
    email: string;
}

export class ResetPasswordDto {
    @ApiProperty()
    @IsString()
    token: string;

    @ApiProperty({ example: 'newpassword123' })
    @IsString()
    @MinLength(8, { message: 'Password minimal 8 karakter' })
    password: string;
}
