export interface AuthResponse {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber?: string;
    role: string;
    status: string;
  };
}

export interface TokenPayload {
  userId: string;
  email: string;
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  browser: string;
  os: string;
  userAgent: string;
}

export interface RequestLike {
  headers?: Record<string, string | string[] | undefined>;
  connection?: { remoteAddress?: string };
  socket?: { remoteAddress?: string };
  ip?: string;
}

export interface CreateSessionDto {
  userId: string;
  accessToken: string;
  refreshToken: string;
  deviceInfo: DeviceInfo;
  ip: string;
}
