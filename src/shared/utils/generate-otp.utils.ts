export function generateOtpCode(length: number = 6) {
  const min: number = Math.pow(10, length - 1);
  const max: number = Math.pow(10, length) - 1;
  return String(Math.floor(Math.random() * (max - min + 1) + min));
}
