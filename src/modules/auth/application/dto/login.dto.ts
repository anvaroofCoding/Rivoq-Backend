import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsEmailOrPhone } from './validators/auth.validator.js';

export class LoginDto {
  @ApiProperty({
    example: 'abdulborimahammadjanov86@gmail.com',
    description: 'Email yoki telefon raqam (+998947932005)',
  })
  @IsString()
  @IsEmailOrPhone()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
