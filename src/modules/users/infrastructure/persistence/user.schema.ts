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

  @Prop({
    type: SchemaTypes.String,
    required: [true, "Father's name is required"],
    trim: true,
  })
  fathersName: string;

  @Prop({ type: SchemaTypes.Date, required: [true, 'BirthDay is required'] })
  birthDay: Date;

  @Prop({
    type: SchemaTypes.String,
    required: [true, 'Nationality is required'],
    trim: true,
  })
  nationality: string;

  @Prop({ type: SchemaTypes.String, unique: true, sparse: true, trim: true })
  instagramUsername: string;

  @Prop({ type: SchemaTypes.String, unique: true, sparse: true, trim: true })
  telegramUsername: string;

  @Prop({ type: SchemaTypes.String, unique: true, sparse: true, trim: true })
  githubUsername: string;

  @Prop({ type: SchemaTypes.String, unique: true, sparse: true, trim: true })
  linkedInUsername: string;

  @Prop({ type: SchemaTypes.String })
  address: string;

  @Prop({ type: SchemaTypes.String })
  bio: string;

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

  @Prop({ type: SchemaTypes.String })
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

  @Prop({ type: SchemaTypes.String, unique: true, sparse: true })
  googleId: string;

  @Prop({ type: SchemaTypes.String, unique: true, sparse: true })
  githubId: string;

  @Prop({ type: SchemaTypes.String })
  photo: string;

  @Prop({
    type: SchemaTypes.String,
    enum: ['local', 'google', 'github'],
    default: 'local',
  })
  provider: string;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
