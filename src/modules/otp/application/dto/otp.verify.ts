import { IsNotEmpty, IsString } from 'class-validator';
import { OtpPurpose } from '../../../../shared/application/dto/otp.dto.js';

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  purpose: OtpPurpose;
}
