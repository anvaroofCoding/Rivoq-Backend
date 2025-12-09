import { Body, Controller, Post } from '@nestjs/common';

import { AuthService } from '../../application/services/auth/auth.service.js';
import { RegisterDto } from '../../application/dto/register.dto.js';
import { LoginDto } from '../../application/dto/login.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return await this.service.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.service.login(loginDto);
  }
}
