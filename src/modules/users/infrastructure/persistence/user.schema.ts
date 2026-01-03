import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, versionKey: false })
export class User {
  @Prop({ type: SchemaTypes.String, trim: true })
  firstName: string;

  @Prop({ type: SchemaTypes.String, trim: true })
  lastName: string;

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
    enum: ['admin', 'superadmin', 'teacher', 'student', 'operator'],
  })
  role: string;

  @Prop({
    type: SchemaTypes.String,
    enum: ['active', 'inactive'],
    default: 'inactive',
  })
  status: string;

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

  @Prop({ default: false })
  isProfileCompleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
