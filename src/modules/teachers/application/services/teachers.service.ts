import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import {
  Teachers,
  TeachersDocument,
} from '../../infrastructure/persistence/teachers.schema.js';

@Injectable()
export class TeachersService {
  constructor(
    @InjectModel(Teachers.name)
    private readonly teachersModel: Model<TeachersDocument>,
  ) {}
}
