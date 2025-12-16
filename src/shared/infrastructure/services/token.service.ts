import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { TokenPayload } from '../../application/interfaces/repository.interface.js';
import { getJwtConfig } from '../../../config/env.config.js';

@Injectable()
export class TokenService {
  private readonly jwtConfig: ReturnType<typeof getJwtConfig>;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtConfig = getJwtConfig(this.configService);
  }

  async generateAccessToken(payload: TokenPayload): Promise<string> {
    try {
      return await this.jwtService.signAsync(payload, {
        secret: this.jwtConfig.accessSecret,
        expiresIn: this.jwtConfig.accessExpiry,
      });
    } catch (error) {
      throw new Error(`Failed to generate access token: ${error}`);
    }
  }

  async generateRefreshToken(payload: TokenPayload): Promise<string> {
    try {
      return await this.jwtService.signAsync(payload, {
        secret: this.jwtConfig.refreshSecret,
        expiresIn: this.jwtConfig.refreshExpiry,
      });
    } catch (error) {
      throw new Error(`Failed to generate refresh token: ${error}`);
    }
  }
}
