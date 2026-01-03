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
import { JwtPayload } from '../../../shared/application/interfaces/repository.interface.js';

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
        'Authentication token not found. Please login to continue.',
      );
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.jwtConfig.accessSecret,
      });

      request.user = {
        userId: payload.userId,
        email: payload.email,
      };

      return true;
    } catch (error) {
      if (error === 'TokenExpiredError') {
        throw new UnauthorizedException(
          'Access token has expired. Please login again.',
        );
      }

      if (error === 'JsonWebTokenError') {
        throw new UnauthorizedException(
          'Invalid authentication token. Please login again.',
        );
      }

      if (error === 'NotBeforeError') {
        throw new UnauthorizedException(
          'Token is not yet valid. Please try again later.',
        );
      }

      throw new UnauthorizedException(
        'Authentication failed. Please login again.',
      );
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return undefined;
    }

    return token;
  }
}
