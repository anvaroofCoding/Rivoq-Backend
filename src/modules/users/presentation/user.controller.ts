import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { UserService } from '../application/services/user.service.js';
import { CreateAdminDto } from '../application/dto/create-admin.js';

@ApiTags('Admins Management')
@Controller('admin')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Post('create-admin')
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return await this.service.createAdmin(createAdminDto);
  }
}
