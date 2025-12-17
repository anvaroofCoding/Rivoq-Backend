import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, versionKey: false })
export class User {
  @Prop({
    type: SchemaTypes.String,
    required: [true, 'FirstName is required'],
    trim: true,
  })
  firstName: string;

  @Prop({
    type: SchemaTypes.String,
    required: [true, 'LastName is required'],
    trim: true,
  })
  lastName: string;

  @Prop({ type: SchemaTypes.String, unique: true, sparse: true, trim: true })
  instagramUsername: string;

  @Prop({ type: SchemaTypes.String, unique: true, sparse: true, trim: true })
  telegramUsername: string;

  @Prop({ type: SchemaTypes.String, unique: true, sparse: true, trim: true })
  phoneNumber: string;

  @Prop({
    type: SchemaTypes.String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
  })
  email: string;

  @Prop({ type: SchemaTypes.String, required: [true, 'Password is required'] })
  password: string;

  @Prop({
    type: SchemaTypes.String,
    enum: ['active', 'inactive'],
    default: 'inactive',
  })
  status: string;

  @Prop({
    type: SchemaTypes.String,
    enum: ['admin', 'superadmin', 'teacher', 'student', 'operator'],
  })
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
