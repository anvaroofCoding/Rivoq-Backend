import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ResendOtpDto {
  @ApiProperty({ example: 'islomanvarov05@gmail.com' })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
