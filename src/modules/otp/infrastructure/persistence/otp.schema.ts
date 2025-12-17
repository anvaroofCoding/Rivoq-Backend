import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import { HydratedDocument, SchemaTypes } from 'mongoose';

export type OtpDocument = HydratedDocument<Otp>;

@Schema({ timestamps: true, versionKey: false })
export class Otp {
  @Prop({
    type: SchemaTypes.String,
    required: [true, 'Identifier (email yoki telefon) talab qilinadi'],
    trim: true,
    lowercase: true,
  })
  identifier: string;

  @Prop({
    type: SchemaTypes.String,
    required: [true, 'OTP kodi talab qilinadi'],
  })
  code: string;

  @Prop({
    type: SchemaTypes.String,
    required: [true, 'OTP maqsadi talab qilinadi'],
    enum: [
      'registration',
      'login',
      'password-reset',
      'email-verification',
      'phone-verification',
      'resend-registration-otp',
    ],
  })
  purpose: string;

  @Prop({
    type: SchemaTypes.String,
    required: true,
    enum: ['email', 'sms'],
    default: 'email',
  })
  channel: string;

  @Type(() => Date)
  @Prop({
    type: SchemaTypes.Date,
    index: { expires: 0 },
  })
  expiresAt: Date;

  @Prop({
    type: SchemaTypes.Boolean,
    default: false,
  })
  isVerified: boolean;

  @Prop({
    type: SchemaTypes.Number,
    default: 0,
  })
  attemptCount: number;

  @Prop({
    type: SchemaTypes.Number,
    default: 5,
  })
  maxAttempts: number;

  @Type(() => Number)
  @Prop({
    type: SchemaTypes.Mixed,
    default: {},
  })
  metadata: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

OtpSchema.index({ identifier: 1, purpose: 1 });
