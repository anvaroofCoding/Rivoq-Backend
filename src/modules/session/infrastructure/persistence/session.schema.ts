import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type SessionDocument = HydratedDocument<Session>;

@Schema({ timestamps: true, versionKey: false })
export class Session {
  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: SchemaTypes.String,
    required: true,
  })
  accessToken: string;

  @Prop({
    type: SchemaTypes.String,
    required: true,
  })
  refreshToken: string;

  @Prop({
    type: SchemaTypes.String,
    required: true,
    index: true,
  })
  deviceId: string;

  @Prop({
    type: SchemaTypes.String,
    required: true,
  })
  deviceName: string;

  @Prop({
    type: SchemaTypes.String,
  })
  browser: string;

  @Prop({
    type: SchemaTypes.String,
  })
  os: string;

  @Prop({
    type: SchemaTypes.String,
    required: true,
  })
  userAgent: string;

  @Prop({
    type: SchemaTypes.String,
  })
  ip: string;

  @Prop({
    type: SchemaTypes.Date,
    default: Date.now,
  })
  loginAt: Date;

  @Prop({
    type: SchemaTypes.Date,
    default: Date.now,
  })
  lastActivityAt: Date;

  @Type(() => Date)
  @Prop({
    type: SchemaTypes.Date,
  })
  expiresAt: Date;

  @Prop({
    type: SchemaTypes.Boolean,
    default: true,
  })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

SessionSchema.index({ userId: 1, deviceId: 1 });
SessionSchema.index({ userId: 1, isActive: 1 });

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
