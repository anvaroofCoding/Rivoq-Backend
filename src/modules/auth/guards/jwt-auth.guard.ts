import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import { getJwtConfig } from '../../../config/env.config.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly jwtConfig: ReturnType<typeof getJwtConfig>;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtConfig = getJwtConfig(this.configService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(
        'Token not found. Please login to continue.',
      );
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: String(this.jwtConfig.accessSecret),
      });

      request.user = {
        userId: payload.userId,
        email: payload.email,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException(`${error}`);
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
