# OTP Service - Ishlatish misollari

## 1. Auth Service'da OTP bilan ro'yxatdan o'tish

```typescript
// auth.service.ts
import { Injectable } from '@nestjs/common';
import { OtpService, OtpPurpose, OtpChannel } from '../../../shared/infrastructure/services/otp.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly otpService: OtpService,
    // ... boshqa dependency'lar
  ) {}

  /**
   * 1-QADAM: Foydalanuvchi email kiriting, OTP jo'natamiz
   */
  async requestRegistrationOTP(email: string) {
    // Email allaqachon mavjud emasligini tekshirish
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictError('Email allaqachon ro\'yxatdan o\'tgan');
    }

    // OTP jo'natish
    return this.otpService.sendOTP({
      identifier: email,
      purpose: OtpPurpose.REGISTRATION,
      channel: OtpChannel.EMAIL,
      metadata: { action: 'user-registration' },
    });
  }

  /**
   * 2-QADAM: Foydalanuvchi OTP kodni kiritadi va verify qilamiz
   */
  async verifyAndRegister(registerDto: RegisterDto, otpCode: string) {
    // 1. OTP'ni tekshirish
    await this.otpService.verifyOTP({
      identifier: registerDto.email,
      code: otpCode,
      purpose: OtpPurpose.REGISTRATION,
    });

    // 2. OTP to'g'ri bo'lsa, foydalanuvchini ro'yxatdan o'tkazish
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const newUser = await this.userModel.create({
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      email: registerDto.email,
      password: hashedPassword,
      role: registerDto.role,
      status: 'active', // OTP tasdiqlangani uchun active
    });

    // 3. OTP'ni o'chirish (tozalash)
    await this.otpService.deleteOTP(registerDto.email, OtpPurpose.REGISTRATION);

    return {
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        // ...
      },
    };
  }

  /**
   * BONUS: OTP'ni qayta jo'natish
   */
  async resendRegistrationOTP(email: string) {
    return this.otpService.resendOTP({
      identifier: email,
      purpose: OtpPurpose.REGISTRATION,
      channel: OtpChannel.EMAIL,
    });
  }
}
```

---

## 2. Auth Controller'da endpoint'lar

```typescript
// auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register/request-otp
   * Email kiritish va OTP so'rash
   */
  @Post('register/request-otp')
  async requestOTP(@Body('email') email: string) {
    return this.authService.requestRegistrationOTP(email);
  }

  /**
   * POST /auth/register/verify
   * OTP bilan ro'yxatdan o'tish
   */
  @Post('register/verify')
  async registerWithOTP(
    @Body() registerDto: RegisterDto,
    @Body('otpCode') otpCode: string,
  ) {
    return this.authService.verifyAndRegister(registerDto, otpCode);
  }

  /**
   * POST /auth/register/resend-otp
   * OTP qayta jo'natish
   */
  @Post('register/resend-otp')
  async resendOTP(@Body('email') email: string) {
    return this.authService.resendRegistrationOTP(email);
  }
}
```

---

## 3. Parolni tiklash (Password Reset)

```typescript
// auth.service.ts

/**
 * Parol tiklash: 1-qadam - OTP so'rash
 */
async requestPasswordResetOTP(email: string) {
  // Foydalanuvchi mavjudligini tekshirish
  const user = await this.userModel.findOne({ email });
  if (!user) {
    throw new NotFoundError('Foydalanuvchi topilmadi');
  }

  // OTP jo'natish
  return this.otpService.sendOTP({
    identifier: email,
    purpose: OtpPurpose.PASSWORD_RESET,
    channel: OtpChannel.EMAIL,
    metadata: { userId: user._id.toString() },
  });
}

/**
 * Parol tiklash: 2-qadam - OTP tekshirish va yangi parol o'rnatish
 */
async resetPasswordWithOTP(
  email: string,
  otpCode: string,
  newPassword: string,
) {
  // 1. OTP tekshirish
  await this.otpService.verifyOTP({
    identifier: email,
    code: otpCode,
    purpose: OtpPurpose.PASSWORD_RESET,
  });

  // 2. Yangi parolni hash qilish
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // 3. Parolni yangilash
  await this.userModel.updateOne(
    { email },
    { password: hashedPassword },
  );

  // 4. OTP'ni o'chirish
  await this.otpService.deleteOTP(email, OtpPurpose.PASSWORD_RESET);

  return { message: 'Parol muvaffaqiyatli yangilandi' };
}
```

---

## 4. Email tasdiqlash (Email Verification)

```typescript
/**
 * Email tasdiqlash uchun OTP jo'natish
 */
async sendEmailVerificationOTP(userId: string) {
  const user = await this.userModel.findById(userId);
  if (!user) {
    throw new NotFoundError('Foydalanuvchi topilmadi');
  }

  if (!user.email) {
    throw new BadRequestError('Email mavjud emas');
  }

  return this.otpService.sendOTP({
    identifier: user.email,
    purpose: OtpPurpose.EMAIL_VERIFICATION,
    channel: OtpChannel.EMAIL,
    metadata: { userId: user._id.toString() },
  });
}

/**
 * Email'ni OTP bilan tasdiqlash
 */
async verifyEmail(userId: string, otpCode: string) {
  const user = await this.userModel.findById(userId);
  if (!user) {
    throw new NotFoundError('Foydalanuvchi topilmadi');
  }

  // OTP tekshirish
  await this.otpService.verifyOTP({
    identifier: user.email,
    code: otpCode,
    purpose: OtpPurpose.EMAIL_VERIFICATION,
  });

  // Email tasdiqlandi deb belgilash
  user.emailVerified = true; // Schema'da qo'shish kerak
  await user.save();

  // OTP'ni o'chirish
  await this.otpService.deleteOTP(user.email, OtpPurpose.EMAIL_VERIFICATION);

  return { message: 'Email muvaffaqiyatli tasdiqlandi' };
}
```

---

## 5. Frontend bilan integratsiya (Flow)

### **Ro'yxatdan o'tish jarayoni:**

```
1. Foydalanuvchi formani to'ldiradi (email, ism, familiya, parol)
   ↓
2. Frontend: POST /auth/register/request-otp
   Body: { "email": "user@example.com" }
   Response: { "message": "OTP kodi email manzilingizga yuborildi", "expiresAt": "..." }
   ↓
3. Foydalanuvchi email'dan OTP kodni oladi (masalan: 123456)
   ↓
4. Frontend: OTP kiritish formasi ko'rsatadi
   ↓
5. Frontend: POST /auth/register/verify
   Body: {
     "firstName": "Ali",
     "lastName": "Valiyev",
     "email": "user@example.com",
     "password": "StrongPass123!",
     "role": "student",
     "otpCode": "123456"
   }
   Response: { "user": { ... } }
   ↓
6. Ro'yxatdan o'tish muvaffaqiyatli!
```

### **OTP qayta jo'natish:**

```
Agar foydalanuvchi OTP olmasa yoki muddati tugasa:

Frontend: POST /auth/register/resend-otp
Body: { "email": "user@example.com" }
Response: { "message": "Yangi OTP kodi yuborildi", "expiresAt": "..." }
```

---

## 6. Module'ga qo'shish

```typescript
// auth.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthController } from './presentation/auth/auth.controller.js';
import { AuthService } from './application/services/auth/auth.service.js';
import { OtpService } from '../../shared/infrastructure/services/otp.service.js';
import { MailService } from '../../shared/infrastructure/services/email.service.js';
import { Otp, OtpSchema } from '../../shared/infrastructure/persistence/otp.schema.js';
import { User, UserSchema } from '../users/infrastructure/persistence/user.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Otp.name, schema: OtpSchema }, // OTP schema qo'shish
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpService, // OTP service qo'shish
    MailService, // Email service
  ],
  exports: [AuthService, OtpService],
})
export class AuthModule {}
```

---

## 7. Xavfsizlik va Best Practices

### ✅ **To'g'ri:**
1. **Rate Limiting:** 1 daqiqada bitta OTP
2. **Max Attempts:** 5 marta noto'g'ri kiritish
3. **TTL (Time To Live):** 5 daqiqa amal qiladi
4. **Crypto Random:** crypto.randomBytes() ishlatilgan
5. **Auto Delete:** MongoDB TTL index orqali avtomatik o'chirish

### ❌ **Xato:**
1. OTP'ni hech qachon client'ga qaytarmaslik
2. Juda uzun muddat (10+ daqiqa) amal qilmasligi kerak
3. Math.random() ishlatmaslik (xavfli!)
4. OTP'ni database'da plain text saqlash (bizda to'g'ri)

---

## 8. Debugging va Testing

```typescript
// OTP statusini tekshirish (development uchun)
const status = await otpService.checkOTPStatus(
  'user@example.com',
  OtpPurpose.REGISTRATION,
);

console.log(status);
// {
//   exists: true,
//   expiresAt: 2024-12-11T12:35:00.000Z,
//   attemptsLeft: 5
// }
```

---

## 9. Error Handling

```typescript
try {
  await otpService.verifyOTP({
    identifier: 'user@example.com',
    code: '123456',
    purpose: OtpPurpose.REGISTRATION,
  });
} catch (error) {
  if (error instanceof NotFoundError) {
    // OTP topilmadi yoki muddati tugagan
  } else if (error instanceof UnauthorizedError) {
    // Noto'g'ri kod kiritilgan
  } else if (error instanceof TooManyRequestsError) {
    // Juda ko'p urinish yoki rate limit
  }
}
```

---

## Xulosa

OTP tizimi to'liq tayyor va ishlatishga tayyor!

**Asosiy afzalliklar:**
- ✅ To'liq TypeScript type safety
- ✅ NestJS best practices
- ✅ Xavfsizlik (rate limiting, max attempts, crypto random)
- ✅ Professional email template
- ✅ Kengaytiriladigan (SMS qo'shish oson)
- ✅ Database TTL orqali auto-cleanup
