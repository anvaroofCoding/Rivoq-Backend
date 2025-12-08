import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  User,
  UserDocument,
} from '../../../../users/infrastructure/persistence/user.schema.js';
import { RegisterDto } from '../../dto/register.dto.js';
import { LoginDto } from '../../dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  register(registerDto: RegisterDto) {
    try {
      console.log(registerDto.firstName);
    } catch (error) {
      console.log(error);
    }
  }

  login(loginDto: LoginDto) {
    try {
      console.log(loginDto.email);
    } catch (error) {
      console.log(error);
    }
  }
}
