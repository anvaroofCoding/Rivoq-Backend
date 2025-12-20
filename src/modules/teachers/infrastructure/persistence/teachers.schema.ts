import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { User } from '../../../users/infrastructure/persistence/user.schema.js';

export type TeachersDocument = HydratedDocument<Teachers>;

@Schema({ timestamps: true, versionKey: false })
export class Teachers extends User {}

export const TeachersSchema = SchemaFactory.createForClass(Teachers);
