import { OtpPurpose } from '../../../../shared/application/dto/otp.dto.js';

export interface VerifyOtpDto {
  identifier: string;
  code: string;
  purpose: OtpPurpose;
}
