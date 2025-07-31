import { z } from 'zod';
import * as dotenv from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';
import { existsSync } from 'fs';
import { resolve } from 'path';

// =====================
// Load Environment Files
// =====================

const NODE_ENV = process.env.NODE_ENV || 'development';

// Load environment files in order of priority
const envFiles = [
  `.env.${NODE_ENV}.local`,
  `.env.local`,
  `.env.${NODE_ENV}`,
  '.env',
];

// Load each env file that exists
for (const envFile of envFiles) {
  const path = resolve(process.cwd(), envFile);
  if (existsSync(path)) {
    const envConfig = dotenv.config({ path });
    dotenvExpand.expand(envConfig);
  }
}

// =====================
// Environment Schema
// =====================

const EnvSchema = z.object({
  // Node Environment
  NODE_ENV: z
    .enum(['development', 'test', 'staging', 'production'])
    .default('development'),
  
  // Application
  PORT: z.string().default('3000').transform(Number),
  APP_URL: z.string().url().default('http://localhost:3000'),
  APP_NAME: z.string().default('Sparkle Universe'),
  APP_VERSION: z.string().optional(),
  
  // Database
  DATABASE_URL: z
    .string()
    .url()
    .refine(
      (url) => url.startsWith('postgresql://') || url.startsWith('postgres://'),
      'DATABASE_URL must be a valid PostgreSQL connection string'
    ),
  DIRECT_URL: z.string().url().optional(),
  READ_REPLICA_URLS: z.string().optional(),
  DATABASE_POOL_SIZE: z.string().default('10').transform(Number),
  DATABASE_LOG_LEVEL: z
    .enum(['query', 'info', 'warn', 'error'])
    .optional(),
  
  // Redis
  REDIS_URL: z
    .string()
    .url()
    .refine(
      (url) => url.startsWith('redis://') || url.startsWith('rediss://'),
      'REDIS_URL must be a valid Redis connection string'
    ),
  REDIS_MAX_RETRIES: z.string().default('3').transform(Number),
  REDIS_RETRY_DELAY: z.string().default('1000').transform(Number),
  
  // Authentication
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  JWT_ISSUER: z.string().default('sparkle-universe'),
  JWT_AUDIENCE: z.string().default('sparkle-universe-app'),
  
  // Security
  BCRYPT_SALT_ROUNDS: z.string().default('12').transform(Number),
  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET must be at least 32 characters'),
  CSRF_SECRET: z.string().min(32).optional(),
  ENCRYPTION_KEY: z.string().min(32).optional(),
  MAX_LOGIN_ATTEMPTS: z.string().default('5').transform(Number),
  LOCKOUT_DURATION: z.string().default('900000').transform(Number),
  
  // OAuth Providers
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  DISCORD_CLIENT_ID: z.string().optional(),
  DISCORD_CLIENT_SECRET: z.string().optional(),
  TWITTER_CLIENT_ID: z.string().optional(),
  TWITTER_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  
  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().default('587').transform(Number),
  SMTP_SECURE: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_REPLY_TO: z.string().email().optional(),
  
  // External APIs
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_ORG_ID: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  HUGGINGFACE_API_KEY: z.string().optional(),
  PINECONE_API_KEY: z.string().optional(),
  PINECONE_ENVIRONMENT: z.string().optional(),
  
  // AWS
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().optional(),
  S3_ENDPOINT: z.string().url().optional(),
  S3_FORCE_PATH_STYLE: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
  
  // Cloudflare
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  CLOUDFLARE_ZONE_ID: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  
  // Blockchain
  ETHEREUM_RPC_URL: z.string().url().optional(),
  POLYGON_RPC_URL: z.string().url().optional(),
  BLOCKCHAIN_PRIVATE_KEY: z.string().optional(),
  CONTRACT_ADDRESS_TOKEN: z.string().optional(),
  CONTRACT_ADDRESS_NFT: z.string().optional(),
  CONTRACT_ADDRESS_MARKETPLACE: z.string().optional(),
  ETHERSCAN_API_KEY: z.string().optional(),
  POLYGONSCAN_API_KEY: z.string().optional(),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Analytics
  GOOGLE_ANALYTICS_ID: z.string().optional(),
  PLAUSIBLE_DOMAIN: z.string().optional(),
  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().url().optional(),
  MIXPANEL_TOKEN: z.string().optional(),
  
  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  NEW_RELIC_LICENSE_KEY: z.string().optional(),
  DATADOG_API_KEY: z.string().optional(),
  
  // Feature Flags
  ENABLE_AI_FEATURES: z
    .string()
    .default('true')
    .transform((val) => val === 'true'),
  ENABLE_BLOCKCHAIN: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
  ENABLE_VIRTUAL_SPACES: z
    .string()
    .default('true')
    .transform((val) => val === 'true'),
  ENABLE_ANALYTICS: z
    .string()
    .default('true')
    .transform((val) => val === 'true'),
  ENABLE_PREMIUM_FEATURES: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
  MAINTENANCE_MODE: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: z.string().default('900000').transform(Number), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
  RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
  
  // Logging
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),
  LOG_TIMESTAMP: z
    .string()
    .default('true')
    .transform((val) => val === 'true'),
  
  // Deployment
  VERCEL_ENV: z
    .enum(['production', 'preview', 'development'])
    .optional(),
  VERCEL_URL: z.string().optional(),
  VERCEL_REGION: z.string().optional(),
  VERCEL_GIT_COMMIT_SHA: z.string().optional(),
  RAILWAY_ENVIRONMENT: z.string().optional(),
  RENDER_SERVICE_NAME: z.string().optional(),
  FLY_APP_NAME: z.string().optional(),
  
  // Next.js Public Variables (automatically exposed to browser)
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_WS_URL: z.string().url().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

// =====================
// Type Definitions
// =====================

export type Env = z.infer<typeof EnvSchema>;

// =====================
// Validation Function
// =====================

function validateEnv(): Env {
  try {
    const parsed = EnvSchema.parse(process.env);
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map((err) => {
          const path = err.path.join('.');
          const message = err.message;
          return `  ❌ ${path}: ${message}`;
        })
        .join('\n');

      console.error(
        '\n🚨 Environment Validation Error:\n' +
        'The following environment variables are invalid:\n\n' +
        errorMessage +
        '\n\nPlease check your .env files and ensure all required variables are set correctly.\n'
      );

      // In development, we might want to continue with defaults
      if (NODE_ENV === 'development') {
        console.warn(
          '⚠️  Running in development mode with invalid environment variables. ' +
          'This may cause unexpected behavior.'
        );
      } else {
        // In production, we should fail fast
        process.exit(1);
      }
    }
    throw error;
  }
}

// =====================
// Environment Helper Functions
// =====================

export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development';
}

export function isTest(): boolean {
  return env.NODE_ENV === 'test';
}

export function isStaging(): boolean {
  return env.NODE_ENV === 'staging';
}

export function isProduction(): boolean {
  return env.NODE_ENV === 'production';
}

export function isServer(): boolean {
  return typeof window === 'undefined';
}

export function isClient(): boolean {
  return typeof window !== 'undefined';
}

export function getPublicUrl(): string {
  if (env.VERCEL_URL) {
    return `https://${env.VERCEL_URL}`;
  }
  return env.APP_URL;
}

export function getApiUrl(): string {
  if (isClient() && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return `${getPublicUrl()}/api`;
}

export function getWebSocketUrl(): string {
  if (isClient() && process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  const url = new URL(getPublicUrl());
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}

// =====================
// Feature Flags
// =====================

export const features = {
  ai: () => env.ENABLE_AI_FEATURES,
  blockchain: () => env.ENABLE_BLOCKCHAIN,
  virtualSpaces: () => env.ENABLE_VIRTUAL_SPACES,
  analytics: () => env.ENABLE_ANALYTICS,
  premium: () => env.ENABLE_PREMIUM_FEATURES,
  maintenance: () => env.MAINTENANCE_MODE,
} as const;

// =====================
// Configuration Objects
// =====================

export const databaseConfig = {
  url: env.DATABASE_URL,
  directUrl: env.DIRECT_URL,
  readReplicaUrls: env.READ_REPLICA_URLS?.split(','),
  poolSize: env.DATABASE_POOL_SIZE,
  logLevel: env.DATABASE_LOG_LEVEL,
} as const;

export const redisConfig = {
  url: env.REDIS_URL,
  maxRetries: env.REDIS_MAX_RETRIES,
  retryDelay: env.REDIS_RETRY_DELAY,
} as const;

export const authConfig = {
  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiry: env.JWT_ACCESS_EXPIRY,
    refreshExpiry: env.JWT_REFRESH_EXPIRY,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  },
  bcrypt: {
    saltRounds: env.BCRYPT_SALT_ROUNDS,
  },
  session: {
    secret: env.SESSION_SECRET,
  },
  oauth: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    discord: {
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
    },
    twitter: {
      clientId: env.TWITTER_CLIENT_ID,
      clientSecret: env.TWITTER_CLIENT_SECRET,
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
} as const;

export const emailConfig = {
  smtp: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER && env.SMTP_PASS
      ? {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        }
      : undefined,
  },
  from: env.EMAIL_FROM,
  replyTo: env.EMAIL_REPLY_TO,
} as const;

export const storageConfig = {
  s3: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION,
    bucket: env.S3_BUCKET,
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
  },
  r2: {
    accountId: env.CLOUDFLARE_ACCOUNT_ID,
    apiToken: env.CLOUDFLARE_API_TOKEN,
    bucket: env.R2_BUCKET,
  },
} as const;

// =====================
// Validate and Export
// =====================

export const env = validateEnv();

// Re-export schema for testing
export { EnvSchema };

// Default export
export default env;
