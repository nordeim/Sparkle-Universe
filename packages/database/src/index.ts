import { PrismaClient, Prisma } from '@prisma/client';
import { createSoftDeleteExtension } from 'prisma-extension-soft-delete';
import { readReplicas } from '@prisma/extension-read-replicas';
import { pagination } from 'prisma-extension-pagination';
import { cache } from 'prisma-extension-cache';
import Redis from 'ioredis';

// =====================
// Types and Interfaces
// =====================

export * from '@prisma/client';
export { Prisma };

type LogLevel = 'info' | 'query' | 'warn' | 'error';

interface DatabaseConfig {
  databaseUrl: string;
  directUrl?: string;
  readReplicaUrls?: string[];
  redisUrl?: string;
  enableLogging?: boolean;
  logLevels?: LogLevel[];
  maxQueryTime?: number;
  connectionTimeout?: number;
  poolSize?: number;
}

interface QueryOptions {
  cache?: boolean;
  cacheTTL?: number;
  includeDeleted?: boolean;
}

// =====================
// Configuration
// =====================

const config: DatabaseConfig = {
  databaseUrl: process.env.DATABASE_URL!,
  directUrl: process.env.DIRECT_URL,
  readReplicaUrls: process.env.READ_REPLICA_URLS?.split(','),
  redisUrl: process.env.REDIS_URL,
  enableLogging: process.env.NODE_ENV === 'development',
  logLevels: ['query', 'error', 'warn'] as LogLevel[],
  maxQueryTime: 5000, // 5 seconds
  connectionTimeout: 10000, // 10 seconds
  poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '10'),
};

// =====================
// Redis Client for Caching
// =====================

const redis = config.redisUrl ? new Redis(config.redisUrl) : null;

// =====================
// Prisma Client Setup
// =====================

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  let client = new PrismaClient({
    datasources: {
      db: {
        url: config.databaseUrl,
      },
    },
    log: config.enableLogging
      ? config.logLevels?.map(level => ({
          emit: 'event',
          level,
        }))
      : undefined,
  });

  // Add read replicas if available
  if (config.readReplicaUrls && config.readReplicaUrls.length > 0) {
    client = client.$extends(
      readReplicas({
        replicas: config.readReplicaUrls.map(url => ({
          url,
          queryEngineType: 'binary',
        })),
      })
    );
  }

  // Add soft delete extension
  client = client.$extends(
    createSoftDeleteExtension({
      models: {
        User: true,
        Post: true,
        Comment: true,
      },
      defaultConfig: {
        field: 'deletedAt',
        createValue: () => new Date(),
      },
    })
  );

  // Add pagination extension
  client = client.$extends(
    pagination({
      pages: {
        limit: 20,
        includePageCount: true,
      },
      cursor: {
        limit: 20,
        setCursor: true,
      },
    })
  );

  // Add caching extension if Redis is available
  if (redis) {
    client = client.$extends(
      cache({
        redis,
        ttl: 300, // 5 minutes default
        prefix: 'prisma:',
      })
    );
  }

  return client;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// =====================
// Query Logging & Monitoring
// =====================

if (config.enableLogging) {
  // @ts-ignore - Prisma event types
  prisma.$on('query', (e: any) => {
    if (e.duration > config.maxQueryTime!) {
      console.warn(`Slow query detected (${e.duration}ms):`, e.query);
    }
    console.log(`Query: ${e.query}`);
    console.log(`Duration: ${e.duration}ms`);
  });

  // @ts-ignore
  prisma.$on('error', (e: any) => {
    console.error('Prisma error:', e);
  });

  // @ts-ignore
  prisma.$on('warn', (e: any) => {
    console.warn('Prisma warning:', e);
  });
}

// =====================
// Connection Management
// =====================

export async function connect(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

export async function disconnect(): Promise<void> {
  try {
    await prisma.$disconnect();
    if (redis) {
      redis.disconnect();
    }
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
    throw error;
  }
}

// =====================
// Health Check
// =====================

export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency: number;
  details: any;
}> {
  const start = Date.now();
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    
    return {
      status: 'healthy',
      latency,
      details: {
        connected: true,
        responseTime: `${latency}ms`,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latency: Date.now() - start,
      details: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

// =====================
// Database Utilities
// =====================

export async function cleanDatabase(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot clean database in production');
  }

  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    console.log('✅ Database cleaned successfully');
  } catch (error) {
    console.error('❌ Database cleaning failed:', error);
    throw error;
  }
}

export async function resetSequences(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot reset sequences in production');
  }

  const sequences = await prisma.$queryRaw<
    Array<{ sequence_name: string }>
  >`SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'`;

  for (const { sequence_name } of sequences) {
    await prisma.$executeRawUnsafe(
      `ALTER SEQUENCE "${sequence_name}" RESTART WITH 1`
    );
  }

  console.log('✅ Sequences reset successfully');
}

// =====================
// Transaction Utilities
// =====================

export async function withTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: {
    maxWait?: number;
    timeout?: number;
    isolationLevel?: Prisma.TransactionIsolationLevel;
  }
): Promise<T> {
  return prisma.$transaction(fn, {
    maxWait: options?.maxWait ?? 5000,
    timeout: options?.timeout ?? 10000,
    isolationLevel: options?.isolationLevel,
  });
}

// =====================
// Query Helpers
// =====================

export function excludeFields<T, K extends keyof T>(
  data: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...data };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

export function includeDeleted<T extends { deletedAt?: Date | null }>(
  items: T[]
): T[] {
  return items;
}

export function excludeDeleted<T extends { deletedAt?: Date | null }>(
  items: T[]
): T[] {
  return items.filter(item => !item.deletedAt);
}

// =====================
// Pagination Helpers
// =====================

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export async function paginate<T>(
  model: any,
  params: PaginationParams & { where?: any; orderBy?: any },
): Promise<PaginatedResult<T>> {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model.findMany({
      where: params.where,
      orderBy: params.orderBy,
      skip,
      take: limit,
    }),
    model.count({ where: params.where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

// =====================
// Full-Text Search
// =====================

export async function searchPosts(
  query: string,
  options?: {
    limit?: number;
    offset?: number;
    authorId?: string;
    categoryId?: string;
  }
): Promise<any[]> {
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;

  let whereClause = `
    WHERE p.status = 'PUBLISHED' 
    AND p."deletedAt" IS NULL 
    AND (
      to_tsvector('english', p.title || ' ' || COALESCE(p."contentText", '')) 
      @@ plainto_tsquery('english', $1)
    )
  `;

  const params: any[] = [query];
  let paramIndex = 2;

  if (options?.authorId) {
    whereClause += ` AND p."authorId" = $${paramIndex}`;
    params.push(options.authorId);
    paramIndex++;
  }

  if (options?.categoryId) {
    whereClause += ` AND p."categoryId" = $${paramIndex}`;
    params.push(options.categoryId);
    paramIndex++;
  }

  const searchQuery = `
    SELECT 
      p.id,
      p.title,
      p.slug,
      p.excerpt,
      p."coverImage",
      p."authorId",
      p."viewCount",
      p."createdAt",
      ts_rank(
        to_tsvector('english', p.title || ' ' || COALESCE(p."contentText", '')),
        plainto_tsquery('english', $1)
      ) AS rank
    FROM posts p
    ${whereClause}
    ORDER BY rank DESC, p."createdAt" DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  return prisma.$queryRawUnsafe(searchQuery, ...params);
}

// =====================
// Cache Management
// =====================

export async function clearCache(pattern?: string): Promise<void> {
  if (!redis) {
    console.warn('Redis not configured, skipping cache clear');
    return;
  }

  try {
    if (pattern) {
      const keys = await redis.keys(`prisma:${pattern}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } else {
      await redis.flushdb();
    }
    console.log('✅ Cache cleared successfully');
  } catch (error) {
    console.error('❌ Cache clearing failed:', error);
    throw error;
  }
}

// =====================
// Migration Utilities
// =====================

export async function runMigrations(): Promise<void> {
  try {
    const { execSync } = require('child_process');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

export async function createMigration(name: string): Promise<void> {
  try {
    const { execSync } = require('child_process');
    execSync(`npx prisma migrate dev --name ${name}`, { stdio: 'inherit' });
    console.log('✅ Migration created successfully');
  } catch (error) {
    console.error('❌ Migration creation failed:', error);
    throw error;
  }
}

// =====================
// Seeding Utilities
// =====================

export async function seed(): Promise<void> {
  try {
    const { execSync } = require('child_process');
    execSync('npx prisma db seed', { stdio: 'inherit' });
    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// =====================
// Export Types for Extensions
// =====================

export type ExtendedPrismaClient = typeof prisma;
export type TransactionClient = Prisma.TransactionClient;

// =====================
// Graceful Shutdown
// =====================

process.on('SIGINT', async () => {
  await disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnect();
  process.exit(0);
});
