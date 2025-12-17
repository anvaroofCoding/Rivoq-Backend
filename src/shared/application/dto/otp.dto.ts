export enum OtpPurpose {
  REGISTRATION = 'registration',
  LOGIN = 'login',
  PASSWORD_RESET = 'password-reset',
  EMAIL_VERIFICATION = 'email-verification',
  PHONE_VERIFICATION = 'phone-verification',
  RESEND_OTP_CODE = 'resend-registration-otp',
}

export enum OtpChannel {
  email = 'email',
  sms = 'sms',
}
