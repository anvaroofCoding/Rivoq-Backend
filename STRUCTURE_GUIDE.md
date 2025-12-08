# 📚 NestJS DDD Struktura - To'liq Qo'llanma

## Asosiy Struktura

```
src/
├── shared/                                    # 🌍 Barcha joyda ishlatiladigan kod
│   ├── domain/
│   │   ├── base-entity.ts                    # Base entity class
│   │   ├── value-objects/                    # Shared value objects
│   │   │   ├── email.vo.ts
│   │   │   └── phone-number.vo.ts
│   │   └── exceptions/                       # Domain exceptions
│   │       ├── domain.exception.ts
│   │       └── validation.exception.ts
│   │
│   ├── infrastructure/                        # 🔧 Tashqi servislar bilan ishlash
│   │   ├── database/
│   │   │   ├── mongodb.module.ts
│   │   │   └── base.repository.ts
│   │   │
│   │   ├── services/                         # 📧 Infrastructure Services
│   │   │   ├── email/
│   │   │   │   ├── email.service.interface.ts
│   │   │   │   ├── email.service.ts          # Email yuborish
│   │   │   │   ├── providers/
│   │   │   │   │   ├── smtp.provider.ts      # SMTP implementation
│   │   │   │   │   ├── sendgrid.provider.ts  # SendGrid implementation
│   │   │   │   │   └── resend.provider.ts    # Resend implementation
│   │   │   │   └── email.module.ts
│   │   │   │
│   │   │   ├── sms/
│   │   │   │   ├── sms.service.interface.ts
│   │   │   │   ├── sms.service.ts            # SMS yuborish
│   │   │   │   ├── providers/
│   │   │   │   │   ├── twilio.provider.ts
│   │   │   │   │   ├── eskiz.provider.ts     # O'zbekiston uchun
│   │   │   │   │   └── playmobile.provider.ts
│   │   │   │   └── sms.module.ts
│   │   │   │
│   │   │   ├── storage/
│   │   │   │   ├── storage.service.interface.ts
│   │   │   │   ├── storage.service.ts        # File storage
│   │   │   │   ├── providers/
│   │   │   │   │   ├── s3.provider.ts
│   │   │   │   │   └── local.provider.ts
│   │   │   │   └── storage.module.ts
│   │   │   │
│   │   │   └── cache/
│   │   │       ├── cache.service.ts          # Redis/Memory cache
│   │   │       └── cache.module.ts
│   │   │
│   │   ├── logging/                          # 📝 Logger
│   │   │   ├── logger.service.ts             # Winston logger
│   │   │   ├── logger.module.ts
│   │   │   └── logger.interceptor.ts
│   │   │
│   │   └── filters/                          # ⚠️ Global Exception Filters
│   │       ├── http-exception.filter.ts
│   │       ├── all-exceptions.filter.ts
│   │       └── validation.filter.ts
│   │
│   ├── application/                           # 🎯 Shared application logic
│   │   ├── dto/                              # Shared DTOs
│   │   │   └── pagination.dto.ts
│   │   ├── interfaces/                       # Shared interfaces
│   │   │   └── repository.interface.ts
│   │   └── decorators/                       # Custom decorators
│   │       ├── current-user.decorator.ts
│   │       └── roles.decorator.ts
│   │
│   └── utils/                                 # 🛠️ Helper funktsiyalar
│       ├── crypto.utils.ts                   # Hash, encrypt, decrypt
│       ├── date.utils.ts                     # Sana bilan ishlash
│       ├── string.utils.ts                   # String manipulation
│       ├── otp.utils.ts                      # OTP generate qilish
│       └── validators.utils.ts               # Custom validators
│
├── modules/                                    # 🏢 Business Modullar
│   ├── auth/                                  # Authentication moduli
│   │   ├── domain/
│   │   │   ├── otp.entity.ts                 # OTP domain entity
│   │   │   ├── token.entity.ts               # Token domain entity
│   │   │   └── services/                     # 🎯 Domain Services
│   │   │       └── otp-validator.service.ts  # OTP validation business logic
│   │   │
│   │   ├── application/
│   │   │   ├── services/                     # 🚀 Application Services (Use Cases)
│   │   │   │   ├── auth.service.ts           # Login, Register orchestration
│   │   │   │   ├── otp.service.ts            # OTP yuborish orchestration
│   │   │   │   └── token.service.ts          # Token generation
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   └── send-otp.dto.ts
│   │   │   └── commands/                     # CQRS commands
│   │   │       └── send-otp.command.ts
│   │   │
│   │   ├── infrastructure/
│   │   │   └── persistence/
│   │   │       ├── otp.schema.ts
│   │   │       └── otp.repository.ts
│   │   │
│   │   └── presentation/
│   │       └── auth.controller.ts            # HTTP endpoints
│   │
│   └── users/
│       ├── domain/
│       │   ├── user.entity.ts
│       │   └── services/                     # Domain Services
│       │       └── user-validator.service.ts # User validation logic
│       ├── application/
│       │   └── services/
│       │       └── user.service.ts           # User CRUD orchestration
│       ├── infrastructure/
│       │   └── persistence/
│       │       ├── user.schema.ts
│       │       └── user.repository.ts
│       └── presentation/
│           └── user.controller.ts
│
└── config/                                     # ⚙️ Configuration
    ├── env.validation.ts
    └── app.config.ts
```

---

## 📖 Har bir papkaning vazifasi

### 1. `shared/infrastructure/services/` - Infrastructure Services
**Vazifasi:** Tashqi dunyo bilan ishlash (email, sms, storage, payment, etc.)

**Qachon ishlatiladi:**
- ✅ Email yuborish
- ✅ SMS yuborish
- ✅ File upload qilish
- ✅ Payment gateway bilan ishlash
- ✅ Push notification yuborish
- ✅ 3rd party API'lar bilan ishlash

**Xususiyati:**
- Business logic yo'q
- Faqat tashqi servis bilan bog'lanish
- Har doim interface orqali ishlatiladi (dependency injection uchun)
- Provider pattern ishlatiladi (masalan, email uchun SMTP yoki SendGrid)

---

### 2. `shared/utils/` - Utility Functions
**Vazifasi:** Oddiy, stateless helper funktsiyalar

**Qachon ishlatiladi:**
- ✅ String format qilish
- ✅ Sana format qilish
- ✅ Random OTP generate qilish
- ✅ Hash qilish (bcrypt)
- ✅ Validation helper'lar

**Xususiyati:**
- Dependency yo'q (yoki minimal)
- Pure functions
- Reusable
- Business logic yo'q

---

### 3. `modules/[module]/domain/services/` - Domain Services
**Vazifasi:** Business logic, lekin bir entity bilan bog'liq emas

**Qachon ishlatiladi:**
- ✅ OTP validation (bir nechta qoidalar)
- ✅ Price calculation (discount, tax, etc.)
- ✅ Order fulfillment logic
- ✅ Inventory management

**Xususiyati:**
- Faqat business logic
- DB yoki tashqi servislar bilan to'g'ridan-to'g'ri ishlamaydi
- Pure domain knowledge

---

### 4. `modules/[module]/application/services/` - Application Services
**Vazifasi:** Use case'larni orchestrate qilish (turli servislarni birlashtirish)

**Qachon ishlatiladi:**
- ✅ Login flow (user topish + token yaratish + log qilish)
- ✅ OTP yuborish flow (OTP generate + save + email/sms yuborish)
- ✅ Order creation (validate + save + send notification)

**Xususiyati:**
- Orchestration
- Domain services + Infrastructure services'ni birlashtiradi
- Transaction management
- Business workflow

---

### 5. `shared/infrastructure/logging/` - Logger
**Vazifasi:** Har qanday log yozish

**Qachon ishlatiladi:**
- ✅ Error log
- ✅ Info log
- ✅ Debug log
- ✅ Request/Response log

---

### 6. `shared/infrastructure/filters/` - Global Exception Filters
**Vazifasi:** Barcha error'larni yagona joyda handle qilish

**Qachon ishlatiladi:**
- ✅ HTTP exceptions
- ✅ Domain exceptions
- ✅ Validation errors
- ✅ Unexpected errors

---

## 🎯 Amaliy Misollar

### Misol 1: Email OTP yuborish

**Flow:**
```
Controller → Application Service → Utils + Infrastructure Service + Repository
```

**Qayerda qanday kod:**

1. **Utils** - OTP generate qilish
```typescript
// src/shared/utils/otp.utils.ts
export class OtpUtils {
  static generate(length: number = 6): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static isExpired(createdAt: Date, ttlMinutes: number = 5): boolean {
    const now = new Date();
    const diff = (now.getTime() - createdAt.getTime()) / 1000 / 60;
    return diff > ttlMinutes;
  }
}
```

2. **Infrastructure Service** - Email yuborish
```typescript
// src/shared/infrastructure/services/email/email.service.ts
@Injectable()
export class EmailService {
  async sendOtp(email: string, otp: string): Promise<void> {
    // SMTP/SendGrid orqali yuborish
  }
}
```

3. **Application Service** - Hammasi birlashtirish
```typescript
// src/modules/auth/application/services/otp.service.ts
@Injectable()
export class OtpService {
  constructor(
    private readonly emailService: EmailService,
    private readonly otpRepository: OtpRepository,
    private readonly logger: LoggerService,
  ) {}

  async sendEmailOtp(email: string): Promise<void> {
    // 1. OTP generate (utils)
    const code = OtpUtils.generate();

    // 2. Save to DB (repository)
    await this.otpRepository.save({ email, code });

    // 3. Send email (infrastructure service)
    await this.emailService.sendOtp(email, code);

    // 4. Log
    this.logger.info(`OTP sent to ${email}`);
  }
}
```

---

### Misol 2: SMS OTP yuborish

```typescript
// src/modules/auth/application/services/otp.service.ts
async sendSmsOtp(phone: string): Promise<void> {
  const code = OtpUtils.generate(); // Utils
  await this.otpRepository.save({ phone, code }); // Repository
  await this.smsService.sendOtp(phone, code); // Infrastructure Service
  this.logger.info(`SMS OTP sent to ${phone}`); // Logger
}
```

---

## 📊 Decision Tree - Qayerga qo'shish?

```
Yangi funktsiya yozmoqchiman
  │
  ├─ Tashqi servis bilan bog'liqmi? (email, sms, payment, storage)
  │   └─ ✅ YES → shared/infrastructure/services/[service-name]/
  │
  ├─ Oddiy helper funktsiyami? (format, generate, validate)
  │   └─ ✅ YES → shared/utils/
  │
  ├─ Business logic bor, lekin bitta entity ga bog'liq emasmi?
  │   └─ ✅ YES → modules/[module]/domain/services/
  │
  ├─ Bir nechta servislarni birlashtirish kerakmi? (orchestration)
  │   └─ ✅ YES → modules/[module]/application/services/
  │
  ├─ Global error handling kerakmi?
  │   └─ ✅ YES → shared/infrastructure/filters/
  │
  └─ Logging kerakmi?
      └─ ✅ YES → shared/infrastructure/logging/
```

---

## 🚀 Keyingi qadamlar

Endi men sizga:
1. Email service
2. SMS service
3. Logger
4. Global error filter
5. Utils

Ularning to'liq kodini yozib beramanmi?
