function normalizeEmail(email: string) {
  return email ? email.trim().toLowerCase() : undefined;
}

function normalizePhoneNumber(phoneNumber: string) {
  if (!phoneNumber) return undefined;

  let normalizedPhoneNumber = phoneNumber.replace(/[^\d+]/g, '');
  if (!normalizedPhoneNumber.startsWith('+')) {
    normalizedPhoneNumber = '+' + normalizedPhoneNumber;
  }
  return normalizedPhoneNumber;
}

export { normalizeEmail, normalizePhoneNumber };
