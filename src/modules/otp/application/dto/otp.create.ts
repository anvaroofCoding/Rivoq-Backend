import {
  OtpChannel,
  OtpPurpose,
} from '../../../../shared/application/dto/otp.dto.js';

export interface CreateOtpDto {
  identifier: string;
  purpose: OtpPurpose;
  channel: OtpChannel;
  metadata?: Record<string, any>;
}
