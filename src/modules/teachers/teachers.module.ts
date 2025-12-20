import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { TeachersController } from './presentation/teachers/teachers.controller.js';
import { TeachersService } from './application/services/teachers.service.js';

import {
  Teachers,
  TeachersSchema,
} from './infrastructure/persistence/teachers.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Teachers.name, schema: TeachersSchema },
    ]),
  ],
  controllers: [TeachersController],
  providers: [TeachersService],
  exports: [TeachersService],
})
export class TeachersModule {}
