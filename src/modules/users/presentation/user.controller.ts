import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from '../application/services/user.service.js';
import { CreateAdminDto } from '../application/dto/create-admin.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: UserService) {}

  @Post()
  createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.service.createAdmin(createAdminDto);
  }
}
