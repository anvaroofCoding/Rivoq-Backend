import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';

import {
  Session,
  SessionDocument,
} from '../../infrastructure/persistence/session.schema.js';
import {
  getDeviceConfig,
  getJwtConfig,
} from '../../../../config/env.config.js';
import { CreateSessionDto } from '../../../../shared/application/interfaces/repository.interface.js';

@Injectable()
export class SessionService {
  private readonly jwtConfig: ReturnType<typeof getJwtConfig>;
  private readonly getDeviceConfig: ReturnType<typeof getDeviceConfig>;

  constructor(
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
    private readonly configService: ConfigService,
  ) {
    this.jwtConfig = getJwtConfig(this.configService);
    this.getDeviceConfig = getDeviceConfig(this.configService);
  }

  async createSession(data: CreateSessionDto): Promise<SessionDocument> {
    const { userId, accessToken, refreshToken, deviceInfo, ip } = data;

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + this.jwtConfig.accessExpiry);

    const existingSession = await this.sessionModel.findOne({
      userId: new Types.ObjectId(userId),
      deviceId: deviceInfo.deviceId,
      isActive: true,
    });

    if (existingSession) {
      existingSession.accessToken = accessToken;
      existingSession.refreshToken = refreshToken;
      existingSession.loginAt = new Date();
      existingSession.lastActivityAt = new Date();
      existingSession.expiresAt = expiresAt;
      existingSession.ip = ip;
      existingSession.isActive = true;

      return await existingSession.save();
    }

    const activeSessions = await this.findActiveSessions(userId);

    if (activeSessions.length >= Number(this.getDeviceConfig.max_devices)) {
      await this.deleteOldestSession(userId);
    }

    const session = await this.sessionModel.create({
      userId: new Types.ObjectId(userId),
      accessToken,
      refreshToken,
      deviceId: deviceInfo.deviceId,
      deviceName: deviceInfo.deviceName,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      userAgent: deviceInfo.userAgent,
      ip,
      loginAt: new Date(),
      lastActivityAt: new Date(),
      expiresAt,
      isActive: true,
    });

    return session;
  }

  async findActiveSessions(userId: string): Promise<SessionDocument[]> {
    return await this.sessionModel
      .find({
        userId: new Types.ObjectId(userId),
        isActive: true,
        expiresAt: { $gt: new Date() },
      })
      .sort({ loginAt: -1 })
      .exec();
  }

  async findSessionByToken(
    accessToken: string,
  ): Promise<SessionDocument | null> {
    return await this.sessionModel.findOne({
      accessToken,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });
  }

  async updateLastActivity(sessionId: string): Promise<void> {
    await this.sessionModel.findByIdAndUpdate(sessionId, {
      lastActivityAt: new Date(),
    });
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.sessionModel.findByIdAndUpdate(sessionId, {
      isActive: false,
    });
  }

  async deleteSessionByToken(accessToken: string): Promise<void> {
    await this.sessionModel.findOneAndUpdate(
      { accessToken },
      { isActive: false },
    );
  }

  async deleteOldestSession(userId: string): Promise<void> {
    const sessions = await this.sessionModel
      .find({
        userId: new Types.ObjectId(userId),
        isActive: true,
      })
      .sort({ loginAt: 1 })
      .limit(1)
      .exec();

    if (sessions.length > 0) {
      await this.sessionModel.findByIdAndUpdate(sessions[0]._id, {
        isActive: false,
      });
    }
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    await this.sessionModel.updateMany(
      { userId: new Types.ObjectId(userId) },
      { isActive: false },
    );
  }

  async getUserDevices(userId: string): Promise<
    Array<{
      deviceId: string;
      deviceName: string;
      browser: string;
      os: string;
      loginAt: Date;
      lastActivityAt: Date;
      isCurrent: boolean;
    }>
  > {
    const sessions = await this.findActiveSessions(userId);

    return sessions.map((session) => ({
      deviceId: session.deviceId,
      deviceName: session.deviceName,
      browser: session.browser,
      os: session.os,
      loginAt: session.loginAt,
      lastActivityAt: session.lastActivityAt,
      isCurrent: false,
    }));
  }

  async deleteDeviceSession(userId: string, deviceId: string): Promise<void> {
    await this.sessionModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        deviceId,
      },
      { isActive: false },
    );
  }
}
