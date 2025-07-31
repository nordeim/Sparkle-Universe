import { User, Session, Prisma } from '@sparkle/database';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'crypto';
import { z } from 'zod';
import Redis from 'ioredis';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

// =====================
// Configuration
// =====================

const config = {
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    issuer: process.env.JWT_ISSUER || 'sparkle-universe',
    audience: process.env.JWT_AUDIENCE || 'sparkle-universe-app',
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),
  },
  session: {
    maxDevices: parseInt(process.env.MAX_DEVICES_PER_USER || '5'),
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '86400000'), // 24 hours
  },
  security: {
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '900000'), // 15 minutes
    passwordMinLength: 8,
    passwordMaxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
};

// =====================
// Redis Client
// =====================

const redis = config.redis.url ? new Redis(config.redis.url) : null;

// =====================
// Types & Interfaces
// =====================

export interface TokenPayload {
  sub: string; // User ID
  email: string;
  username: string;
  role: string;
  sessionId: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string | string[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface AuthResult {
  user: Partial<User>;
  tokens: TokenPair;
  session: Session;
}

export interface VerifyOptions {
  checkRevoked?: boolean;
  checkSession?: boolean;
}

export interface TwoFactorAuthResult {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

// =====================
// Validation Schemas
// =====================

export const passwordSchema = z
  .string()
  .min(config.security.passwordMinLength, `Password must be at least ${config.security.passwordMinLength} characters`)
  .max(config.security.passwordMaxLength, `Password must be at most ${config.security.passwordMaxLength} characters`)
  .refine(
    (val) => !config.security.requireUppercase || /[A-Z]/.test(val),
    'Password must contain at least one uppercase letter'
  )
  .refine(
    (val) => !config.security.requireLowercase || /[a-z]/.test(val),
    'Password must contain at least one lowercase letter'
  )
  .refine(
    (val) => !config.security.requireNumbers || /\d/.test(val),
    'Password must contain at least one number'
  )
  .refine(
    (val) => !config.security.requireSpecialChars || /[!@#$%^&*(),.?":{}|<>]/.test(val),
    'Password must contain at least one special character'
  );

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .toLowerCase()
  .trim();

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
  .trim();

// =====================
// Password Hashing
// =====================

export async function hashPassword(password: string): Promise<string> {
  // Validate password
  const validation = passwordSchema.safeParse(password);
  if (!validation.success) {
    throw new AuthError(
      validation.error.errors[0].message,
      'INVALID_PASSWORD',
      400
    );
  }

  return bcrypt.hash(password, config.bcrypt.saltRounds);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateSecurePassword(): string {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  let password = '';
  
  const randomValues = randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }
  
  return password;
}

// =====================
// Token Management
// =====================

export function generateTokens(
  user: User,
  sessionId: string
): TokenPair {
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    sessionId,
  };

  const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
    algorithm: 'HS256',
  });

  const refreshToken = jwt.sign(
    { sub: user.id, sessionId },
    config.jwt.refreshSecret,
    {
      expiresIn: config.jwt.refreshExpiry,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
      algorithm: 'HS256',
    }
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: 900, // 15 minutes in seconds
    tokenType: 'Bearer',
  };
}

export async function verifyAccessToken(
  token: string,
  options: VerifyOptions = {}
): Promise<TokenPayload> {
  try {
    const payload = jwt.verify(token, config.jwt.accessSecret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
      algorithms: ['HS256'],
    }) as TokenPayload;

    // Check if token is revoked
    if (options.checkRevoked && redis) {
      const isRevoked = await redis.exists(`revoked:${token}`);
      if (isRevoked) {
        throw new AuthError('Token has been revoked', 'TOKEN_REVOKED', 401);
      }
    }

    // Check if session is valid
    if (options.checkSession && redis) {
      const sessionExists = await redis.exists(`session:${payload.sessionId}`);
      if (!sessionExists) {
        throw new AuthError('Session not found', 'SESSION_NOT_FOUND', 401);
      }
    }

    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthError('Token has expired', 'TOKEN_EXPIRED', 401);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthError('Invalid token', 'INVALID_TOKEN', 401);
    }
    throw error;
  }
}

export async function verifyRefreshToken(
  token: string
): Promise<{ sub: string; sessionId: string }> {
  try {
    const payload = jwt.verify(token, config.jwt.refreshSecret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
      algorithms: ['HS256'],
    }) as { sub: string; sessionId: string };

    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthError('Refresh token has expired', 'REFRESH_TOKEN_EXPIRED', 401);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthError('Invalid refresh token', 'INVALID_REFRESH_TOKEN', 401);
    }
    throw error;
  }
}

export async function revokeToken(token: string): Promise<void> {
  if (!redis) {
    console.warn('Redis not configured, cannot revoke token');
    return;
  }

  // Decode token to get expiration
  const decoded = jwt.decode(token) as any;
  if (!decoded || !decoded.exp) {
    return;
  }

  const ttl = decoded.exp - Math.floor(Date.now() / 1000);
  if (ttl > 0) {
    await redis.setex(`revoked:${token}`, ttl, '1');
  }
}

// =====================
// Session Management
// =====================

export async function createSession(
  userId: string,
  deviceInfo?: {
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    deviceInfo?: any;
  }
): Promise<string> {
  const sessionId = generateSessionId();
  const sessionData = {
    userId,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    ...deviceInfo,
  };

  if (redis) {
    await redis.setex(
      `session:${sessionId}`,
      config.session.sessionTimeout / 1000,
      JSON.stringify(sessionData)
    );
  }

  return sessionId;
}

export async function getSession(sessionId: string): Promise<any | null> {
  if (!redis) {
    return null;
  }

  const data = await redis.get(`session:${sessionId}`);
  return data ? JSON.parse(data) : null;
}

export async function updateSessionActivity(sessionId: string): Promise<void> {
  if (!redis) {
    return;
  }

  const session = await getSession(sessionId);
  if (session) {
    session.lastActivity = Date.now();
    await redis.setex(
      `session:${sessionId}`,
      config.session.sessionTimeout / 1000,
      JSON.stringify(session)
    );
  }
}

export async function destroySession(sessionId: string): Promise<void> {
  if (redis) {
    await redis.del(`session:${sessionId}`);
  }
}

export async function destroyAllUserSessions(userId: string): Promise<void> {
  if (!redis) {
    return;
  }

  // Get all session keys
  const keys = await redis.keys('session:*');
  
  for (const key of keys) {
    const session = await redis.get(key);
    if (session) {
      const sessionData = JSON.parse(session);
      if (sessionData.userId === userId) {
        await redis.del(key);
      }
    }
  }
}

function generateSessionId(): string {
  return randomBytes(32).toString('hex');
}

// =====================
// Two-Factor Authentication
// =====================

export async function generateTwoFactorSecret(
  user: User
): Promise<TwoFactorAuthResult> {
  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `Sparkle Universe (${user.email})`,
    issuer: 'Sparkle Universe',
    length: 32,
  });

  // Generate QR code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

  // Generate backup codes
  const backupCodes = Array.from({ length: 8 }, () =>
    randomBytes(4).toString('hex').toUpperCase()
  );

  return {
    secret: secret.base32,
    qrCode,
    backupCodes,
  };
}

export function verifyTwoFactorToken(
  token: string,
  secret: string
): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps tolerance
  });
}

export function verifyBackupCode(
  code: string,
  backupCodes: string[]
): boolean {
  return backupCodes.includes(code.toUpperCase());
}

// =====================
// Rate Limiting
// =====================

export async function checkLoginAttempts(
  identifier: string
): Promise<{ allowed: boolean; remainingAttempts: number }> {
  if (!redis) {
    return { allowed: true, remainingAttempts: config.security.maxLoginAttempts };
  }

  const key = `login_attempts:${identifier}`;
  const attempts = await redis.incr(key);
  
  if (attempts === 1) {
    await redis.expire(key, config.security.lockoutDuration / 1000);
  }

  const allowed = attempts <= config.security.maxLoginAttempts;
  const remainingAttempts = Math.max(0, config.security.maxLoginAttempts - attempts);

  return { allowed, remainingAttempts };
}

export async function resetLoginAttempts(identifier: string): Promise<void> {
  if (redis) {
    await redis.del(`login_attempts:${identifier}`);
  }
}

// =====================
// OAuth Helpers
// =====================

export function generateOAuthState(): string {
  return randomBytes(32).toString('hex');
}

export async function storeOAuthState(
  state: string,
  data: any,
  ttl: number = 600 // 10 minutes
): Promise<void> {
  if (redis) {
    await redis.setex(`oauth_state:${state}`, ttl, JSON.stringify(data));
  }
}

export async function verifyOAuthState(
  state: string
): Promise<any | null> {
  if (!redis) {
    return null;
  }

  const data = await redis.get(`oauth_state:${state}`);
  if (data) {
    await redis.del(`oauth_state:${state}`);
    return JSON.parse(data);
  }

  return null;
}

// =====================
// Password Reset
// =====================

export function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function storeResetToken(
  userId: string,
  token: string,
  ttl: number = 3600 // 1 hour
): Promise<void> {
  if (redis) {
    const hashedToken = hashResetToken(token);
    await redis.setex(`reset_token:${hashedToken}`, ttl, userId);
  }
}

export async function verifyResetToken(
  token: string
): Promise<string | null> {
  if (!redis) {
    return null;
  }

  const hashedToken = hashResetToken(token);
  const userId = await redis.get(`reset_token:${hashedToken}`);
  
  if (userId) {
    await redis.del(`reset_token:${hashedToken}`);
    return userId;
  }

  return null;
}

// =====================
// Email Verification
// =====================

export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

export async function storeVerificationToken(
  userId: string,
  token: string,
  ttl: number = 86400 // 24 hours
): Promise<void> {
  if (redis) {
    await redis.setex(`verify_email:${token}`, ttl, userId);
  }
}

export async function verifyEmailToken(
  token: string
): Promise<string | null> {
  if (!redis) {
    return null;
  }

  const userId = await redis.get(`verify_email:${token}`);
  
  if (userId) {
    await redis.del(`verify_email:${token}`);
    return userId;
  }

  return null;
}

// =====================
// Security Headers
// =====================

export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex');
}

export async function storeCSRFToken(
  sessionId: string,
  token: string
): Promise<void> {
  if (redis) {
    await redis.setex(
      `csrf:${sessionId}`,
      config.session.sessionTimeout / 1000,
      token
    );
  }
}

export async function verifyCSRFToken(
  sessionId: string,
  token: string
): Promise<boolean> {
  if (!redis) {
    return true; // Skip CSRF check if Redis not available
  }

  const storedToken = await redis.get(`csrf:${sessionId}`);
  return storedToken === token;
}

// =====================
// IP Address Validation
// =====================

export function isValidIP(ip: string): boolean {
  // IPv4
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

  // IPv6
  const ipv6Regex = /^([\da-f]{1,4}:){7}[\da-f]{1,4}$/i;
  return ipv6Regex.test(ip);
}

export function anonymizeIP(ip: string): string {
  if (!ip) return '';

  // IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.');
    parts[3] = '0';
    return parts.join('.');
  }

  // IPv6
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return parts.slice(0, 4).join(':') + '::';
  }

  return '';
}

// =====================
// Error Handling
// =====================

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// =====================
// Utility Functions
// =====================

export function isStrongPassword(password: string): boolean {
  try {
    passwordSchema.parse(password);
    return true;
  } catch {
    return false;
  }
}

export function generateRandomString(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

export function sanitizeUser(user: User): Partial<User> {
  const { hashedPassword, ...sanitized } = user;
  return sanitized;
}

// =====================
// Exports
// =====================

export * from './types';
export { config as authConfig };
