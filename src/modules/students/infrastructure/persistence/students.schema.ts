import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { User } from '../../../users/infrastructure/persistence/user.schema.js';

export type StudentsDocument = HydratedDocument<Students>;

@Schema({ timestamps: true, versionKey: false })
export class Students extends User {}

export const StudentsSchema = SchemaFactory.createForClass(Students);
