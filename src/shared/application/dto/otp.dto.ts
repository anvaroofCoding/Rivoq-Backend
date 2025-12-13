export enum OtpPurpose {
  REGISTRATION = 'registration',
  LOGIN = 'login',
  PASSWORD_RESET = 'password-reset',
  EMAIL_VERIFICATION = 'email-verification',
  PHONE_VERIFICATION = 'phone-verification',
}

export enum OtpChannel {
  email = 'email',
  sms = 'sms',
}
