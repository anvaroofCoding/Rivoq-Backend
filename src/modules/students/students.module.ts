import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Students,
  StudentsSchema,
} from './infrastructure/persistence/students.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Students.name, schema: StudentsSchema },
    ]),
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class StudentsModule {}
