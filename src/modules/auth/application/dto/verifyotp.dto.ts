import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { OtpPurpose } from '../../../../shared/application/dto/otp.dto.js';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: 'islomanvarov05@gmail.com' })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;

  purpose: OtpPurpose;
}
