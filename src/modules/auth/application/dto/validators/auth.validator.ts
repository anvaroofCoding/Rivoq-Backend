import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isValidPhoneNumber } from 'libphonenumber-js';

@ValidatorConstraint({ async: false })
export class IsEmailOrPhoneConstraint implements ValidatorConstraintInterface {
  validate(identifier: string) {
    if (!identifier) return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(identifier);

    let isPhone = false;
    try {
      if (identifier.startsWith('+') || /^\d+$/.test(identifier)) {
        isPhone = isValidPhoneNumber(identifier);
      }
    } catch (error) {
      console.log(error);
      isPhone = false;
    }
    return isEmail || isPhone;
  }

  defaultMessage() {
    return "Identifier email yoki telefon raqam formatida bo'lishi kerak";
  }
}

export function IsEmailOrPhone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsEmailOrPhoneConstraint,
    });
  };
}

export function identifierType(
  identifier: string,
): 'email' | 'phone' | 'unknown' {
  if (!identifier) return 'unknown';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(identifier)) {
    return 'email';
  }

  try {
    if (identifier.startsWith('+') || /^\d+$/.test(identifier)) {
      if (isValidPhoneNumber(identifier)) return 'phone';
    }
  } catch (error) {
    console.log(error);
  }

  return 'unknown';
}
