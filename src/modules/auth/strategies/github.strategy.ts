import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { getGitHubOAuthConfig } from '../../../config/env.config.js';
import { GitHubProfile } from '../../../shared/application/interfaces/repository.interface.js';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly configService: ConfigService) {
    const githubConfig = getGitHubOAuthConfig(configService);

    super({
      clientID: githubConfig.clientID,
      clientSecret: githubConfig.clientSecret,
      callbackURL: githubConfig.callbackURL,
      scope: ['user:email'],
    });
  }

  validate(accessToken: string, refreshToken: string, profile: GitHubProfile) {
    const nameParts = profile.displayName?.split(' ') || ['', ''];
    const firstName = nameParts[0] || profile.username;
    const lastName = nameParts.slice(1).join(' ') || '';

    const user = {
      githubId: profile.id,
      email: profile.emails[0]?.value || `${profile.username}@github.local`,
      firstName,
      lastName,
      photo: profile.photos[0]?.value || '',
      accessToken,
      refreshToken,
    };

    return user;
  }
}
