import { createHash } from 'crypto';
import {
  DeviceInfo,
  RequestLike,
} from '../application/interfaces/repository.interface.js';
import { UAParser } from 'ua-parser-js';

export function parseDeviceInfo(userAgent: string, ip?: string): DeviceInfo {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const browserName = result.browser.name || 'Unknown Browser';
  const browserVersion = result.browser.version || '';

  const osName = result.os.name || 'Unknown OS';
  const osVersion = result.os.version || '';

  const deviceVendor = result.device.vendor || '';
  const deviceModel = result.device.model || '';

  let deviceName = '';
  if (deviceVendor && deviceModel) {
    deviceName = `${deviceVendor} ${deviceModel}`;
  } else {
    deviceName = `${browserName} on ${osName}`;
  }

  const deviceFingerprint = `${userAgent}-${browserName}-${osName}-${ip || ''}`;
  const deviceId = createHash('sha256')
    .update(deviceFingerprint)
    .digest('hex')
    .substring(0, 32);

  return {
    deviceId,
    deviceName,
    browser: `${browserName} ${browserVersion}`.trim(),
    os: `${osName} ${osVersion}`.trim(),
    userAgent,
  };
}

export function getClientIp(request: RequestLike): string {
  const xForwardedFor = request.headers?.['x-forwarded-for'];
  const forwardedIp =
    typeof xForwardedFor === 'string'
      ? xForwardedFor.split(',')[0]?.trim()
      : undefined;

  return (
    forwardedIp ||
    (typeof request.headers?.['x-real-ip'] === 'string'
      ? request.headers['x-real-ip']
      : undefined) ||
    request.connection?.remoteAddress ||
    request.socket?.remoteAddress ||
    request.ip ||
    'unknown'
  );
}
