import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma, Prisma } from '@sparkle/database';
import { 
  hashPassword, 
  generateTokens, 
  createSession,
  generateVerificationToken,
  storeVerificationToken,
  emailSchema,
  usernameSchema,
  passwordSchema,
  AuthError,
  checkLoginAttempts,
  generateCSRFToken,
  storeCSRFToken,
  isValidIP,
  anonymizeIP
} from '@sparkle/auth';
import { env } from '@sparkle/config';
import { sendEmail } from '@sparkle/email';
import { analyticsService } from '@sparkle/analytics';
import { rateLimiter } from '@/lib/rate-limiter';
import { getClientInfo } from '@/lib/client-info';
import { detectBot } from '@/lib/bot-detection';
import { profanityFilter } from '@/lib/profanity-filter';
import { geolocate } from '@/lib/geolocation';
import { auditLog } from '@/lib/audit';
import { cache } from '@/lib/cache';

// =====================
// Constants
// =====================

const REGISTRATION_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 registration attempts per window
};

const RESERVED_USERNAMES = [
  'admin', 'administrator', 'root', 'system', 'sparkle', 'support',
  'help', 'info', 'api', 'app', 'www', 'mail', 'blog', 'shop',
  'store', 'team', 'staff', 'moderator', 'mod', 'official',
];

// =====================
// Validation Schemas
// =====================

const RegisterSchema = z.object({
  
