import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type UserProfileDocument = HydratedDocument<UserProfile>;

@Schema({ timestamps: true, versionKey: false })
export class UserProfile {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

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
    enum: ['active', 'inactive'],
    default: 'inactive',
  })
  status: string;
}

export const UserProfileSchema = SchemaFactory.createForClass(UserProfile);
