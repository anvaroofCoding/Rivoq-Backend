import { Body, Controller, Post } from '@nestjs/common';

import { AuthService } from '../../application/services/auth/auth.service.js';
import { RegisterDto } from '../../application/dto/register.dto.js';
import { LoginDto } from '../../application/dto/login.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.service.register(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.service.login(loginDto);
  }
}
