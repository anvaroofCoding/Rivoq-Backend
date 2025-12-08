import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  User,
  UserDocument,
} from '../../infrastructure/persistence/user.schema.js';
import { CreateAdminDto } from '../dto/create-admin.js';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  createAdmin(createAdminDto: CreateAdminDto) {
    console.log(createAdminDto);
  }
}
