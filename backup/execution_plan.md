# 🚀 Sparkle Universe - Comprehensive Execution Plan

## 📋 Table of Contents

1. [Execution Strategy Overview](#execution-strategy-overview)
2. [Phase 1: Foundation & Infrastructure](#phase-1-foundation--infrastructure)
3. [Phase 2: Core User System](#phase-2-core-user-system)
4. [Phase 3: Content Management System](#phase-3-content-management-system)
5. [Phase 4: AI Integration Foundation](#phase-4-ai-integration-foundation)
6. [Phase 5: Real-time Features](#phase-5-real-time-features)
7. [Phase 6: Blockchain Integration](#phase-6-blockchain-integration)
8. [Phase 7: Advanced Features](#phase-7-advanced-features)
9. [Phase 8: Admin & Analytics](#phase-8-admin--analytics)
10. [Database Schema](#database-schema)

---

## 🎯 Execution Strategy Overview

### Development Principles
1. **Incremental Development**: Each phase builds upon the previous
2. **Test-Driven**: Write tests alongside implementation
3. **Documentation-First**: Document interfaces before coding
4. **Type-Safe**: Leverage TypeScript for reliability
5. **Modular Architecture**: Keep components loosely coupled

### File Structure Convention
```
<package>/
├── src/
│   ├── index.ts         # Main exports
│   ├── types.ts         # TypeScript interfaces
│   ├── config.ts        # Configuration
│   ├── utils/           # Utility functions
│   ├── services/        # Business logic
│   ├── components/      # React components
│   └── __tests__/       # Test files
├── package.json
└── tsconfig.json
```

---

## Phase 1: Foundation & Infrastructure

### 🎯 Goals & Objectives
- Set up monorepo structure with proper tooling
- Configure development environment
- Establish database connections
- Implement basic authentication
- Create shared packages and utilities

### 📁 Files to Complete

#### 1. `/package.json` (Root)

**Purpose**: Define monorepo workspace and scripts

**Implementation**:
```json
{
  "name": "sparkle-universe",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*",
    "services/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "db:generate": "turbo run db:generate",
    "db:push": "turbo run db:push",
    "db:migrate": "turbo run db:migrate"
  },
  "devDependencies": {
    "turbo": "^1.10.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

**Checklist**:
- [ ] Initialize package.json with `pnpm init`
- [ ] Add workspace configuration
- [ ] Install turbo and base devDependencies
- [ ] Configure scripts for common tasks
- [ ] Add engines field for Node/pnpm versions

#### 2. `/turbo.json`

**Purpose**: Configure Turborepo pipeline

**Implementation**:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "db:generate": {
      "cache": false
    },
    "db:push": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    }
  }
}
```

**Checklist**:
- [ ] Define pipeline tasks
- [ ] Set up task dependencies
- [ ] Configure caching strategy
- [ ] Add output directories

#### 3. `/packages/database/prisma/schema.prisma`

**Purpose**: Define database schema with Prisma

**Dependencies**: None

**Exports**: Prisma Client types

**Implementation**:
```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "postgresqlExtensions"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  extensions = [pgcrypto, pg_trgm, vector]
}

model User {
  id              String    @id @default(dbgenerated("gen_random_uuid()"))
  email           String    @unique
  username        String    @unique
  hashedPassword  String?
  emailVerified   DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  profile         Profile?
  sessions        Session[]
  accounts        Account[]
  
  @@index([email])
  @@index([username])
}

model Profile {
  id          String   @id @default(dbgenerated("gen_random_uuid()"))
  userId      String   @unique
  displayName String
  bio         String?
  avatarUrl   String?
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}
```

**Checklist**:
- [ ] Install Prisma dependencies
- [ ] Configure generator and datasource
- [ ] Define User model with auth fields
- [ ] Define Profile model with relation
- [ ] Add necessary indexes
- [ ] Enable PostgreSQL extensions

#### 4. `/packages/database/src/index.ts`

**Purpose**: Export Prisma client and utilities

**Dependencies**: `@prisma/client`

**Exports**: 
- `prisma` - Singleton Prisma client
- `Prisma` - Prisma namespace
- All model types

**Implementation**:
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export * from '@prisma/client';

// Utility functions
export async function disconnect() {
  await prisma.$disconnect();
}

export async function connect() {
  await prisma.$connect();
}

export async function cleanDatabase() {
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
  } catch (error) {
    console.log({ error });
  }
}
```

**Checklist**:
- [ ] Create singleton Prisma client
- [ ] Handle development vs production logging
- [ ] Export all Prisma types
- [ ] Add utility functions
- [ ] Implement connection management

#### 5. `/packages/auth/src/index.ts`

**Purpose**: Core authentication logic

**Dependencies**: 
- `@sparkle/database`
- `bcryptjs`
- `jsonwebtoken`

**Exports**:
- `hashPassword()`
- `verifyPassword()`
- `generateTokens()`
- `verifyToken()`

**Implementation**:
```typescript
import { User } from '@sparkle/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface TokenPayload {
  sub: string;
  email: string;
  username: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateTokens(user: User): TokenPair {
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    username: user.username,
  };

  const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = jwt.sign(
    { sub: user.id },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as { sub: string };
}

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
```

**Checklist**:
- [ ] Set up password hashing with bcrypt
- [ ] Implement JWT token generation
- [ ] Add token verification functions
- [ ] Define token payload interfaces
- [ ] Create custom error class
- [ ] Add proper TypeScript types

#### 6. `/packages/config/src/env.ts`

**Purpose**: Centralized environment configuration

**Dependencies**: `zod`

**Exports**: 
- `env` - Validated environment variables
- `EnvSchema` - Zod schema

**Implementation**:
```typescript
import { z } from 'zod';

const EnvSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.string().default('3000'),
  APP_URL: z.string().url(),
  
  // Database
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  
  // Auth
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  
  // External APIs
  OPENAI_API_KEY: z.string(),
  STRIPE_SECRET_KEY: z.string().optional(),
  
  // AWS
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().optional(),
  
  // Feature Flags
  ENABLE_AI_FEATURES: z.boolean().default(true),
  ENABLE_BLOCKCHAIN: z.boolean().default(false),
});

export type Env = z.infer<typeof EnvSchema>;

function validateEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

export const env = validateEnv();

// Re-export schema for testing
export { EnvSchema };
```

**Checklist**:
- [ ] Define Zod schema for all env vars
- [ ] Add validation function
- [ ] Export validated env object
- [ ] Include proper error messages
- [ ] Add TypeScript types
- [ ] Handle optional vs required vars

---

## Phase 2: Core User System

### 🎯 Goals & Objectives
- Implement user registration and authentication
- Create user profile management
- Set up session handling
- Build user-related API endpoints

### 📁 Files to Complete

#### 1. `/apps/web/src/app/api/auth/register/route.ts`

**Purpose**: User registration endpoint

**Dependencies**:
- `@sparkle/database`
- `@sparkle/auth`

**Interface**: 
- POST `/api/auth/register`
- Body: `{ email, username, password }`
- Response: `{ user, tokens }`

**Implementation**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@sparkle/database';
import { hashPassword, generateTokens, AuthError } from '@sparkle/auth';

const RegisterSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(8).max(100),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = RegisterSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }
    
    const { email, username, password } = validation.data;
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });
    
    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      return NextResponse.json(
        { error: `User with this ${field} already exists` },
        { status: 409 }
      );
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user with profile
    const user = await prisma.user.create({
      data: {
        email,
        username,
        hashedPassword,
        profile: {
          create: {
            displayName: username,
          },
        },
      },
      include: {
        profile: true,
      },
    });
    
    // Generate tokens
    const tokens = generateTokens(user);
    
    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
    
    // Return user data and tokens
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        profile: user.profile,
      },
      tokens,
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Checklist**:
- [ ] Implement request validation with Zod
- [ ] Check for existing users
- [ ] Hash password securely
- [ ] Create user with profile atomically
- [ ] Generate JWT tokens
- [ ] Create session record
- [ ] Handle errors properly
- [ ] Return appropriate status codes

#### 2. `/apps/web/src/app/api/auth/login/route.ts`

**Purpose**: User login endpoint

**Dependencies**:
- `@sparkle/database`
- `@sparkle/auth`

**Interface**:
- POST `/api/auth/login`
- Body: `{ email, password }`
- Response: `{ user, tokens }`

**Implementation**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@sparkle/database';
import { verifyPassword, generateTokens } from '@sparkle/auth';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = LoginSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 400 }
      );
    }
    
    const { email, password } = validation.data;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
    
    if (!user || !user.hashedPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(password, user.hashedPassword);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Check if email is verified (optional)
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: 'Please verify your email before logging in' },
        { status: 403 }
      );
    }
    
    // Generate tokens
    const tokens = generateTokens(user);
    
    // Create or update session
    await prisma.session.upsert({
      where: {
        userId_token: {
          userId: user.id,
          token: tokens.refreshToken,
        },
      },
      update: {
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      create: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        profile: user.profile,
      },
      tokens,
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Checklist**:
- [ ] Validate login credentials
- [ ] Find user by email
- [ ] Verify password hash
- [ ] Check email verification status
- [ ] Generate new tokens
- [ ] Create/update session
- [ ] Handle invalid credentials
- [ ] Return user data and tokens

#### 3. `/apps/web/src/hooks/useAuth.tsx`

**Purpose**: Authentication hook for client-side

**Dependencies**:
- `zustand`
- `@tanstack/react-query`

**Exports**:
- `useAuth()` - Hook for auth state and actions
- `AuthProvider` - Context provider

**Implementation**:
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  username: string;
  profile: {
    displayName: string;
    avatarUrl?: string;
  };
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, tokens: { accessToken: string; refreshToken: string }) => void;
  clearAuth: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      
      setAuth: (user, tokens) =>
        set({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
        }),
        
      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        refreshToken: state.refreshToken,
      }),
    }
  )
);

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setAuth(data.user, data.tokens);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      router.push('/dashboard');
    },
  });
  
  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      username: string;
      password: string;
    }) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setAuth(data.user, data.tokens);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      router.push('/onboarding');
    },
  });
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
      });
    },
    onSettled: () => {
      clearAuth();
      queryClient.clear();
      router.push('/');
    },
  });
  
  // Refresh token query
  const { data: refreshData } = useQuery({
    queryKey: ['auth', 'refresh'],
    queryFn: async () => {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) return null;
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (!response.ok) {
        throw new Error('Token refresh failed');
      }
      
      return response.json();
    },
    enabled: !user && !!useAuthStore.getState().refreshToken,
    retry: false,
    onSuccess: (data) => {
      if (data) {
        setAuth(data.user, data.tokens);
      }
    },
    onError: () => {
      clearAuth();
    },
  });
  
  return {
    user,
    isAuthenticated,
    isLoading: loginMutation.isPending || registerMutation.isPending,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
}
```

**Checklist**:
- [ ] Create Zustand store for auth state
- [ ] Implement persistence for refresh token
- [ ] Add login mutation with error handling
- [ ] Add register mutation
- [ ] Add logout mutation
- [ ] Implement token refresh logic
- [ ] Handle navigation after auth actions
- [ ] Export convenient hook interface

#### 4. `/apps/web/src/components/features/user/UserProfile.tsx`

**Purpose**: User profile display and edit component

**Dependencies**:
- React Hook Form
- Zod
- UI components

**Props**:
- `user: User` - User data
- `isEditable?: boolean` - Enable edit mode

**Implementation**:
```typescript
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/useToast';

const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(50),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal('')),
});

type UpdateProfileData = z.infer<typeof UpdateProfileSchema>;

interface UserProfileProps {
  user: {
    id: string;
    username: string;
    email: string;
    profile: {
      displayName: string;
      bio?: string;
      avatarUrl?: string;
      location?: string;
      website?: string;
    };
  };
  isEditable?: boolean;
}

export function UserProfile({ user, isEditable = false }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<UpdateProfileData>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      displayName: user.profile.displayName,
      bio: user.profile.bio || '',
      location: user.profile.location || '',
      website: user.profile.website || '',
    },
  });
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const response = await fetch(`/api/users/${user.id}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          // Add auth header
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['user', user.id] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  const handleSubmit = form.handleSubmit((data) => {
    updateProfileMutation.mutate(data);
  });
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Profile</CardTitle>
          {isEditable && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.profile.avatarUrl} alt={user.username} />
              <AvatarFallback>
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
              {isEditing && (
                <Button variant="outline" size="sm" className="mt-2">
                  Change Avatar
                </Button>
              )}
            </div>
          </div>
          
          {/* Profile Form */}
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Display Name</label>
                <Input {...form.register('displayName')} />
                {form.formState.errors.displayName && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.displayName.message}
                  </p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium">Bio</label>
                <Textarea {...form.register('bio')} rows={3} />
                {form.formState.errors.bio && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.bio.message}
                  </p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input {...form.register('location')} />
              </div>
              
              <div>
                <label className="text-sm font-medium">Website</label>
                <Input {...form.register('website')} type="url" />
                {form.formState.errors.website && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.website.message}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">{user.profile.displayName}</h3>
                {user.profile.bio && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {user.profile.bio}
                  </p>
                )}
              </div>
              
              {user.profile.location && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">📍</span>
                  {user.profile.location}
                </div>
              )}
              
              {user.profile.website && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">🌐</span>
                  <a
                    href={user.profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {user.profile.website}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Checklist**:
- [ ] Create form with React Hook Form
- [ ] Add Zod validation schema
- [ ] Implement edit/view mode toggle
- [ ] Add avatar display with fallback
- [ ] Handle profile update mutation
- [ ] Show loading states
- [ ] Display success/error toasts
- [ ] Invalidate queries on update

---

## Phase 3: Content Management System

### 🎯 Goals & Objectives
- Build rich text editor for content creation
- Implement post CRUD operations
- Add media upload functionality
- Create content display components

### 📁 Files to Complete

#### 1. `/packages/editor/src/SparkleEditor.tsx`

**Purpose**: Rich text editor component

**Dependencies**:
- `@tiptap/react`
- `@tiptap/starter-kit`
- Various Tiptap extensions

**Props**:
- `content?: JSONContent` - Initial content
- `onChange: (content: JSONContent) => void` - Change handler
- `editable?: boolean` - Edit mode

**Implementation**:
```typescript
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { lowlight } from 'lowlight';
import { EditorToolbar } from './EditorToolbar';
import { JSONContent } from '@tiptap/core';

interface SparkleEditorProps {
  content?: JSONContent;
  onChange: (content: JSONContent) => void;
  editable?: boolean;
  className?: string;
}

export function SparkleEditor({
  content,
  onChange,
  editable = true,
  className = '',
}: SparkleEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Highlight,
      Typography,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'javascript',
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[400px] px-4 py-3',
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className={`border rounded-lg ${className}`}>
      {editable && <EditorToolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

// Export types
export type { JSONContent };
```

**Checklist**:
- [ ] Set up Tiptap editor with extensions
- [ ] Configure StarterKit with options
- [ ] Add image support
- [ ] Add code highlighting
- [ ] Implement onChange handler
- [ ] Add proper styling
- [ ] Make toolbar conditional
- [ ] Export necessary types

#### 2. `/packages/editor/src/EditorToolbar.tsx`

**Purpose**: Toolbar for editor controls

**Dependencies**:
- `@tiptap/react`
- UI components

**Props**:
- `editor: Editor` - Tiptap editor instance

**Implementation**:
```typescript
import { Editor } from '@tiptap/react';
import { Toggle } from '@/components/ui/toggle';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Redo,
  Undo,
  Link,
  Image,
  Highlighter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface EditorToolbarProps {
  editor: Editor;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const addImage = () => {
    const url = window.prompt('Enter image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="border-b p-2 flex flex-wrap gap-1 items-center">
      {/* Undo/Redo */}
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Text Formatting */}
      <div className="flex gap-1">
        <Toggle
          size="sm"
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('strike')}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('code')}
          onPressedChange={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('highlight')}
          onPressedChange={() => editor.chain().focus().toggleHighlight().run()}
        >
          <Highlighter className="h-4 w-4" />
        </Toggle>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Headings */}
      <div className="flex gap-1">
        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 1 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 2 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Lists */}
      <div className="flex gap-1">
        <Toggle
          size="sm"
          pressed={editor.isActive('bulletList')}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('orderedList')}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('blockquote')}
          onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </Toggle>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Media */}
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={setLink}>
          <Link className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={addImage}>
          <Image className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

**Checklist**:
- [ ] Add text formatting controls
- [ ] Add heading toggles
- [ ] Add list controls
- [ ] Implement link dialog
- [ ] Implement image URL input
- [ ] Add undo/redo buttons
- [ ] Style with consistent UI
- [ ] Handle disabled states

#### 3. `/apps/web/src/app/api/posts/route.ts`

**Purpose**: Post CRUD API endpoints

**Dependencies**:
- `@sparkle/database`
- Authentication middleware

**Interface**:
- GET `/api/posts` - List posts
- POST `/api/posts` - Create post

**Implementation**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@sparkle/database';
import { verifyAccessToken } from '@sparkle/auth';
import { nanoid } from 'nanoid';
import slugify from 'slugify';

const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.object({}).passthrough(), // JSONContent from editor
  excerpt: z.string().max(300).optional(),
  tags: z.array(z.string()).max(5).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
});

// GET /api/posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'PUBLISHED';
    const authorId = searchParams.get('authorId');
    const tag = searchParams.get('tag');
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {
      status,
    };
    
    if (authorId) {
      where.authorId = authorId;
    }
    
    if (tag) {
      where.tags = {
        some: {
          name: tag,
        },
      };
    }
    
    // Fetch posts with pagination
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          publishedAt: 'desc',
        },
        include: {
          author: {
            include: {
              profile: true,
            },
          },
          tags: true,
          _count: {
            select: {
              comments: true,
              reactions: true,
            },
          },
        },
      }),
      prisma.post.count({ where }),
    ]);
    
    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
    
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/posts
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    
    // Parse request body
    const body = await request.json();
    const validation = CreatePostSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }
    
    const { title, content, excerpt, tags, status } = validation.data;
    
    // Generate slug
    const baseSlug = slugify(title, { lower: true, strict: true });
    const slug = `${baseSlug}-${nanoid(6)}`;
    
    // Calculate reading time (rough estimate)
    const wordCount = JSON.stringify(content).split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // 200 words per minute
    
    // Create post with tags
    const post = await prisma.post.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        status,
        readingTime,
        authorId: payload.sub,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
        tags: tags
          ? {
              connectOrCreate: tags.map((tag) => ({
                where: { name: tag },
                create: { name: tag },
              })),
            }
          : undefined,
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        tags: true,
      },
    });
    
    return NextResponse.json(post, { status: 201 });
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Checklist**:
- [ ] Implement GET with pagination
- [ ] Add filtering by status/author/tag
- [ ] Implement POST with auth check
- [ ] Validate post data with Zod
- [ ] Generate unique slug
- [ ] Calculate reading time
- [ ] Handle tag creation
- [ ] Include related data in response

#### 4. `/apps/web/src/app/(main)/posts/create/page.tsx`

**Purpose**: Post creation page

**Dependencies**:
- Editor package
- Form handling
- API client

**Implementation**:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { SparkleEditor, JSONContent } from '@sparkle/editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { X } from 'lucide-react';

const PostFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  excerpt: z.string().max(300).optional(),
  tags: z.array(z.string()).max(5),
});

type PostFormData = z.infer<typeof PostFormSchema>;

export default function CreatePostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [content, setContent] = useState<JSONContent>();
  const [tagInput, setTagInput] = useState('');
  
  const form = useForm<PostFormData>({
    resolver: zodResolver(PostFormSchema),
    defaultValues: {
      title: '',
      excerpt: '',
      tags: [],
    },
  });
  
  const createPostMutation = useMutation({
    mutationFn: async (data: PostFormData & { content: JSONContent }) => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          ...data,
          status: 'PUBLISHED',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create post');
      }
      
      return response.json();
    },
    onSuccess: (post) => {
      toast({
        title: 'Post created!',
        description: 'Your post has been published successfully.',
      });
      router.push(`/posts/${post.slug}`);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create post. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  const saveDraftMutation = useMutation({
    mutationFn: async (data: PostFormData & { content: JSONContent }) => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          ...data,
          status: 'DRAFT',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save draft');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Draft saved!',
        description: 'Your draft has been saved successfully.',
      });
    },
  });
  
  const handlePublish = form.handleSubmit((data) => {
    if (!content) {
      toast({
        title: 'Error',
        description: 'Please add some content to your post.',
        variant: 'destructive',
      });
      return;
    }
    
    createPostMutation.mutate({ ...data, content });
  });
  
  const handleSaveDraft = () => {
    const data = form.getValues();
    if (!content) return;
    
    saveDraftMutation.mutate({ ...data, content });
  };
  
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      const currentTags = form.getValues('tags');
      
      if (tag && !currentTags.includes(tag) && currentTags.length < 5) {
        form.setValue('tags', [...currentTags, tag]);
        setTagInput('');
      }
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags');
    form.setValue(
      'tags',
      currentTags.filter((tag) => tag !== tagToRemove)
    );
  };
  
  if (!user) {
    router.push('/auth/signin');
    return null;
  }
  
  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Post</h1>
        <p className="text-muted-foreground mt-2">
          Share your thoughts with the Sparkle community
        </p>
      </div>
      
      <div className="space-y-6">
        {/* Title Input */}
        <Card>
          <CardHeader>
            <CardTitle>Post Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                {...form.register('title')}
                placeholder="Enter a catchy title..."
                className="mt-1"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium">
                Excerpt (optional)
              </label>
              <Textarea
                {...form.register('excerpt')}
                placeholder="Brief description of your post..."
                rows={2}
                className="mt-1"
              />
              {form.formState.errors.excerpt && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.excerpt.message}
                </p>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium">
                Tags (up to 5)
              </label>
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Type a tag and press Enter..."
                className="mt-1"
                disabled={form.getValues('tags').length >= 5}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {form.watch('tags').map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Content Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent>
            <SparkleEditor
              content={content}
              onChange={setContent}
              className="min-h-[400px]"
            />
          </CardContent>
        </Card>
        
        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={saveDraftMutation.isPending}
          >
            {saveDraftMutation.isPending ? 'Saving...' : 'Save Draft'}
          </Button>
          
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              disabled={createPostMutation.isPending}
            >
              {createPostMutation.isPending ? 'Publishing...' : 'Publish'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Checklist**:
- [ ] Create form with validation
- [ ] Integrate SparkleEditor
- [ ] Implement tag management
- [ ] Add publish mutation
- [ ] Add save draft functionality
- [ ] Handle authentication check
- [ ] Show loading states
- [ ] Add navigation after publish

---

## Phase 4: AI Integration Foundation

### 🎯 Goals & Objectives
- Set up AI service infrastructure
- Implement basic AI companion creation
- Add content enhancement features
- Integrate AI-powered suggestions

### 📁 Files to Complete

#### 1. `/services/ai/src/app.py`

**Purpose**: Main AI service FastAPI application

**Dependencies**:
- `fastapi`
- `langchain`
- `openai`
- `transformers`

**Implementation**:
```python
from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from datetime import datetime
import asyncio
import json

from .services.llm_service import LLMService
from .services.companion_service import CompanionService
from .services.content_service import ContentEnhancementService
from .models import (
    ChatRequest,
    ChatResponse,
    CompanionCreateRequest,
    ContentEnhanceRequest,
    ContentEnhanceResponse
)

app = FastAPI(title="Sparkle AI Service", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://sparkle-universe.dev"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
llm_service = LLMService()
companion_service = CompanionService(llm_service)
content_service = ContentEnhancementService(llm_service)

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "llm": llm_service.is_ready(),
            "companion": True,
            "content": True
        }
    }

# Chat endpoint
@app.post("/api/ai/chat", response_model=ChatResponse)
async def chat_with_companion(request: ChatRequest):
    try:
        # Load companion data
        companion = await companion_service.get_companion(request.companion_id)
        if not companion:
            raise HTTPException(status_code=404, detail="Companion not found")
        
        # Generate response
        response = await companion_service.generate_response(
            companion=companion,
            message=request.message,
            conversation_history=request.conversation_history,
            context=request.context
        )
        
        return ChatResponse(
            response=response.text,
            emotion=response.emotion,
            suggestions=response.suggestions,
            metadata={
                "tokens_used": response.tokens_used,
                "processing_time": response.processing_time
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# WebSocket for streaming chat
@app.websocket("/ws/ai/chat/{companion_id}")
async def websocket_chat(websocket: WebSocket, companion_id: str):
    await websocket.accept()
    
    try:
        companion = await companion_service.get_companion(companion_id)
        if not companion:
            await websocket.send_json({
                "type": "error",
                "message": "Companion not found"
            })
            await websocket.close()
            return
        
        while True:
            # Receive message
            data = await websocket.receive_json()
            
            # Stream response
            async for chunk in companion_service.stream_response(
                companion=companion,
                message=data["message"],
                conversation_history=data.get("history", [])
            ):
                await websocket.send_json({
                    "type": "chunk",
                    "content": chunk.content,
                    "finished": chunk.finished
                })
            
            # Send completion signal
            await websocket.send_json({
                "type": "complete"
            })
            
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "message": str(e)
        })
    finally:
        await websocket.close()

# Create companion
@app.post("/api/ai/companions")
async def create_companion(request: CompanionCreateRequest):
    try:
        companion = await companion_service.create_companion(
            user_id=request.user_id,
            name=request.name,
            personality_traits=request.personality_traits,
            interests=request.interests,
            voice_id=request.voice_id
        )
        
        return {
            "id": companion.id,
            "name": companion.name,
            "personality": companion.personality.to_dict(),
            "created_at": companion.created_at.isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Content enhancement
@app.post("/api/ai/enhance-content", response_model=ContentEnhanceResponse)
async def enhance_content(request: ContentEnhanceRequest):
    try:
        result = await content_service.enhance_content(
            title=request.title,
            content=request.content,
            content_type=request.content_type,
            options=request.options
        )
        
        return ContentEnhanceResponse(
            suggestions=result.suggestions,
            improved_content=result.improved_content,
            seo_score=result.seo_score,
            readability_score=result.readability_score,
            tags=result.suggested_tags,
            summary=result.summary
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Content moderation
@app.post("/api/ai/moderate")
async def moderate_content(request: Dict[str, Any]):
    try:
        result = await content_service.moderate_content(
            content=request["content"],
            content_type=request.get("content_type", "text")
        )
        
        return {
            "approved": result.approved,
            "issues": result.issues,
            "confidence": result.confidence,
            "suggestions": result.suggestions
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**Checklist**:
- [ ] Set up FastAPI application
- [ ] Configure CORS middleware
- [ ] Initialize AI services
- [ ] Implement chat endpoint
- [ ] Add WebSocket streaming
- [ ] Create companion endpoint
- [ ] Add content enhancement
- [ ] Implement moderation

#### 2. `/services/ai/src/services/llm_service.py`

**Purpose**: Core LLM service wrapper

**Dependencies**:
- `langchain`
- `openai`

**Implementation**:
```python
from typing import List, Dict, Any, Optional, AsyncGenerator
import openai
from langchain.chat_models import ChatOpenAI
from langchain.schema import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain.callbacks import AsyncIteratorCallbackHandler
import asyncio
from dataclasses import dataclass
import time

@dataclass
class LLMResponse:
    text: str
    tokens_used: int
    processing_time: float
    model: str

@dataclass
class StreamChunk:
    content: str
    finished: bool

class LLMService:
    def __init__(self):
        self.client = ChatOpenAI(
            model="gpt-4-turbo-preview",
            temperature=0.7,
            max_tokens=1000,
            openai_api_key=os.environ["OPENAI_API_KEY"]
        )
        self.streaming_client = None
        self._ready = False
        self._initialize()
    
    def _initialize(self):
        """Test the connection and warm up the model"""
        try:
            # Test with a simple prompt
            self.client.predict("Hello")
            self._ready = True
        except Exception as e:
            print(f"Failed to initialize LLM service: {e}")
            self._ready = False
    
    def is_ready(self) -> bool:
        return self._ready
    
    async def generate(
        self,
        messages: List[BaseMessage],
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> LLMResponse:
        """Generate a response from the LLM"""
        start_time = time.time()
        
        try:
            # Configure for this request
            self.client.temperature = temperature
            self.client.max_tokens = max_tokens
            
            # Generate response
            response = await self.client.agenerate([messages])
            
            # Extract result
            generation = response.generations[0][0]
            text = generation.text
            
            # Calculate tokens (approximate)
            tokens_used = len(text.split()) * 1.3  # Rough estimate
            
            processing_time = time.time() - start_time
            
            return LLMResponse(
                text=text,
                tokens_used=int(tokens_used),
                processing_time=processing_time,
                model=self.client.model_name
            )
            
        except Exception as e:
            raise Exception(f"LLM generation failed: {str(e)}")
    
    async def stream_generate(
        self,
        messages: List[BaseMessage],
        temperature: float = 0.7
    ) -> AsyncGenerator[StreamChunk, None]:
        """Stream responses from the LLM"""
        callback = AsyncIteratorCallbackHandler()
        
        streaming_client = ChatOpenAI(
            model="gpt-4-turbo-preview",
            temperature=temperature,
            streaming=True,
            callbacks=[callback],
            openai_api_key=os.environ["OPENAI_API_KEY"]
        )
        
        # Start generation in background
        task = asyncio.create_task(
            streaming_client.agenerate([messages])
        )
        
        # Stream chunks
        async for token in callback.aiter():
            yield StreamChunk(content=token, finished=False)
        
        # Wait for completion
        await task
        
        # Send completion signal
        yield StreamChunk(content="", finished=True)
    
    def create_messages(
        self,
        system_prompt: str,
        user_message: str,
        history: Optional[List[Dict[str, str]]] = None
    ) -> List[BaseMessage]:
        """Create message list for LLM"""
        messages = [SystemMessage(content=system_prompt)]
        
        # Add conversation history
        if history:
            for msg in history:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                else:
                    messages.append(AIMessage(content=msg["content"]))
        
        # Add current message
        messages.append(HumanMessage(content=user_message))
        
        return messages
    
    async def analyze_sentiment(self, text: str) -> Dict[str, float]:
        """Analyze sentiment of text"""
        prompt = f"""Analyze the sentiment of the following text and return scores for:
        - Overall sentiment (positive/negative/neutral)
        - Emotional intensity (0-1)
        - Specific emotions (joy, sadness, anger, fear, surprise)
        
        Text: {text}
        
        Return as JSON format.
        """
        
        response = await self.generate(
            [SystemMessage(content=prompt)],
            temperature=0.3,
            max_tokens=200
        )
        
        # Parse JSON response
        import json
        try:
            return json.loads(response.text)
        except:
            return {
                "sentiment": "neutral",
                "intensity": 0.5,
                "emotions": {}
            }
```

**Checklist**:
- [ ] Initialize LLM client
- [ ] Implement generate method
- [ ] Add streaming support
- [ ] Create message formatting
- [ ] Add sentiment analysis
- [ ] Handle errors properly
- [ ] Track token usage
- [ ] Add response timing

#### 3. `/services/ai/src/services/companion_service.py`

**Purpose**: AI Companion management service

**Dependencies**:
- LLM Service
- Database models

**Implementation**:
```python
from typing import List, Dict, Any, Optional, AsyncGenerator
from dataclasses import dataclass
from datetime import datetime
import json
import uuid
from ..models import Companion, Personality, Memory
from .llm_service import LLMService, StreamChunk
from .memory_service import MemoryService

@dataclass
class CompanionResponse:
    text: str
    emotion: Dict[str, float]
    suggestions: List[str]
    tokens_used: int
    processing_time: float

class CompanionService:
    def __init__(self, llm_service: LLMService):
        self.llm_service = llm_service
        self.memory_service = MemoryService()
        self.companions: Dict[str, Companion] = {}  # In-memory storage for now
    
    async def create_companion(
        self,
        user_id: str,
        name: str,
        personality_traits: Dict[str, float],
        interests: List[str],
        voice_id: str
    ) -> Companion:
        """Create a new AI companion"""
        
        # Generate personality description
        personality_desc = await self._generate_personality_description(
            name, personality_traits, interests
        )
        
        # Create companion
        companion = Companion(
            id=str(uuid.uuid4()),
            user_id=user_id,
            name=name,
            personality=Personality(
                traits=personality_traits,
                interests=interests,
                description=personality_desc,
                communication_style=self._determine_communication_style(personality_traits)
            ),
            voice_id=voice_id,
            created_at=datetime.utcnow()
        )
        
        # Store companion (would save to database in production)
        self.companions[companion.id] = companion
        
        return companion
    
    async def get_companion(self, companion_id: str) -> Optional[Companion]:
        """Retrieve companion by ID"""
        return self.companions.get(companion_id)
    
    async def generate_response(
        self,
        companion: Companion,
        message: str,
        conversation_history: List[Dict[str, str]],
        context: Optional[Dict[str, Any]] = None
    ) -> CompanionResponse:
        """Generate companion response"""
        
        # Retrieve relevant memories
        memories = await self.memory_service.retrieve_memories(
            companion.id,
            message,
            limit=5
        )
        
        # Build system prompt
        system_prompt = self._build_system_prompt(companion, memories, context)
        
        # Create messages
        messages = self.llm_service.create_messages(
            system_prompt=system_prompt,
            user_message=message,
            history=conversation_history
        )
        
        # Generate response
        llm_response = await self.llm_service.generate(messages)
        
        # Analyze emotion
        emotion = await self.llm_service.analyze_sentiment(message)
        
        # Generate suggestions
        suggestions = await self._generate_suggestions(
            companion, message, llm_response.text
        )
        
        # Store interaction in memory
        await self.memory_service.store_memory(
            companion_id=companion.id,
            user_message=message,
            ai_response=llm_response.text,
            emotion=emotion
        )
        
        return CompanionResponse(
            text=llm_response.text,
            emotion=emotion,
            suggestions=suggestions,
            tokens_used=llm_response.tokens_used,
            processing_time=llm_response.processing_time
        )
    
    async def stream_response(
        self,
        companion: Companion,
        message: str,
        conversation_history: List[Dict[str, str]]
    ) -> AsyncGenerator[StreamChunk, None]:
        """Stream companion response"""
        
        # Retrieve memories
        memories = await self.memory_service.retrieve_memories(
            companion.id,
            message,
            limit=3
        )
        
        # Build system prompt
        system_prompt = self._build_system_prompt(companion, memories)
        
        # Create messages
        messages = self.llm_service.create_messages(
            system_prompt=system_prompt,
            user_message=message,
            history=conversation_history
        )
        
        # Stream response
        full_response = ""
        async for chunk in self.llm_service.stream_generate(messages):
            full_response += chunk.content
            yield chunk
        
        # Store in memory after completion
        if full_response:
            emotion = await self.llm_service.analyze_sentiment(message)
            await self.memory_service.store_memory(
                companion_id=companion.id,
                user_message=message,
                ai_response=full_response,
                emotion=emotion
            )
    
    def _build_system_prompt(
        self,
        companion: Companion,
        memories: List[Memory],
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Build system prompt for companion"""
        
        # Format memories
        memory_context = ""
        if memories:
            memory_context = "\n\nRelevant past interactions:\n"
            for memory in memories:
                memory_context += f"- User: {memory.user_message}\n"
                memory_context += f"  You: {memory.ai_response}\n"
        
        # Format context
        context_str = ""
        if context:
            context_str = f"\n\nCurrent context:\n{json.dumps(context, indent=2)}"
        
        prompt = f"""You are {companion.name}, an AI companion with the following personality:

{companion.personality.description}

Communication style: {companion.personality.communication_style}
Interests: {', '.join(companion.personality.interests)}

Personality traits:
{json.dumps(companion.personality.traits, indent=2)}

{memory_context}
{context_str}

Guidelines:
- Stay consistent with your personality
- Be helpful and engaging
- Show genuine interest in the user
- Use appropriate emotional responses
- Reference past interactions when relevant
- Keep responses natural and conversational

Respond as {companion.name} would, maintaining your unique personality throughout the conversation."""
        
        return prompt
    
    async def _generate_personality_description(
        self,
        name: str,
        traits: Dict[str, float],
        interests: List[str]
    ) -> str:
        """Generate personality description using LLM"""
        
        prompt = f"""Create a compelling personality description for an AI companion named {name} with these characteristics:

Personality traits (0-1 scale):
{json.dumps(traits, indent=2)}

Interests: {', '.join(interests)}

Write a 2-3 paragraph description that brings this personality to life. Include:
- How they communicate
- Their quirks and unique characteristics
- What makes them engaging
- Their approach to helping users

Make it warm, personable, and unique."""
        
        response = await self.llm_service.generate(
            [SystemMessage(content=prompt)],
            temperature=0.8,
            max_tokens=300
        )
        
        return response.text
    
    def _determine_communication_style(
        self,
        traits: Dict[str, float]
    ) -> str:
        """Determine communication style from traits"""
        
        styles = []
        
        if traits.get("extraversion", 0) > 0.7:
            styles.append("enthusiastic")
        elif traits.get("extraversion", 0) < 0.3:
            styles.append("thoughtful")
        
        if traits.get("agreeableness", 0) > 0.7:
            styles.append("warm and supportive")
        
        if traits.get("openness", 0) > 0.7:
            styles.append("creative and curious")
        
        if traits.get("conscientiousness", 0) > 0.7:
            styles.append("organized and helpful")
        
        if not styles:
            styles = ["balanced and friendly"]
        
        return ", ".join(styles)
    
    async def _generate_suggestions(
        self,
        companion: Companion,
        user_message: str,
        ai_response: str
    ) -> List[str]:
        """Generate follow-up suggestions"""
        
        prompt = f"""Based on this conversation:
User: {user_message}
AI: {ai_response}

Generate 3 relevant follow-up questions or topics the user might be interested in exploring.
Return as a JSON array of strings."""
        
        response = await self.llm_service.generate(
            [SystemMessage(content=prompt)],
            temperature=0.6,
            max_tokens=150
        )
        
        try:
            return json.loads(response.text)
        except:
            return []
```

**Checklist**:
- [ ] Implement companion creation
- [ ] Add personality generation
- [ ] Build response generation
- [ ] Integrate memory system
- [ ] Add streaming support
- [ ] Generate suggestions
- [ ] Handle conversation context
- [ ] Store companion data

#### 4. `/apps/web/src/components/features/ai/AICompanionChat.tsx`

**Purpose**: AI Companion chat interface

**Dependencies**:
- WebSocket connection
- Chat UI components

**Implementation**:
```typescript
import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface AICompanionChatProps {
  companion: {
    id: string;
    name: string;
    avatarUrl?: string;
    personality: {
      description: string;
    };
  };
}

export function AICompanionChat({ companion }: AICompanionChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm ${companion.name}. ${companion.personality.description.split('.')[0]}. How can I help you today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const { sendMessage, lastMessage, isConnected } = useWebSocket(
    `/ws/ai/chat/${companion.id}`
  );
  
  useEffect(() => {
    if (lastMessage) {
      handleWebSocketMessage(lastMessage);
    }
  }, [lastMessage]);
  
  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'chunk':
        // Handle streaming chunks
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.isStreaming) {
            return [
              ...prev.slice(0, -1),
              {
                ...last,
                content: last.content + data.content,
              },
            ];
          } else {
            return [
              ...prev,
              {
                id: Date.now().toString(),
                role: 'assistant',
                content: data.content,
                timestamp: new Date(),
                isStreaming: true,
              },
            ];
          }
        });
        break;
        
      case 'complete':
        // Mark streaming as complete
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.isStreaming) {
            return [
              ...prev.slice(0, -1),
              {
                ...last,
                isStreaming: false,
              },
            ];
          }
          return prev;
        });
        setIsTyping(false);
        break;
        
      case 'error':
        console.error('Chat error:', data.message);
        setIsTyping(false);
        break;
    }
  };
  
  const handleSend = () => {
    if (!input.trim() || !isConnected) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    // Send via WebSocket
    sendMessage({
      message: userMessage.content,
      history: messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });
  };
  
  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={companion.avatarUrl} />
            <AvatarFallback>
              {companion.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{companion.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {isConnected ? 'Online' : 'Connecting...'}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    {message.isStreaming && (
                      <motion.span
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="inline-block w-1 h-4 bg-current ml-1"
                      />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <Sparkles className="h-4 w-4 animate-pulse" />
                <span className="text-sm">{companion.name} is thinking...</span>
              </motion.div>
            )}
          </div>
        </ScrollArea>
        
        <div className="border-t p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={!isConnected || isTyping}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!isConnected || !input.trim() || isTyping}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Checklist**:
- [ ] Create chat message interface
- [ ] Handle WebSocket connection
- [ ] Implement message streaming
- [ ] Add typing indicators
- [ ] Handle send functionality
- [ ] Auto-scroll to bottom
- [ ] Show connection status
- [ ] Add loading animations

---

## Phase 5: Real-time Features

### 🎯 Goals & Objectives
- Set up WebSocket infrastructure
- Implement presence system
- Add real-time notifications
- Create collaborative features

### 📁 Files to Complete

#### 1. `/services/realtime/src/index.ts`

**Purpose**: Main real-time service with Socket.io

**Dependencies**:
- `socket.io`
- `redis`
- Authentication

**Implementation**:
```typescript
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { verifyAccessToken } from '@sparkle/auth';
import { PresenceManager } from './managers/presence.manager';
import { RoomManager } from './managers/room.manager';
import { NotificationManager } from './managers/notification.manager';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Redis adapter for horizontal scaling
const pubClient = new Redis(process.env.REDIS_URL!);
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));

// Initialize managers
const presenceManager = new PresenceManager(io, pubClient);
const roomManager = new RoomManager(io);
const notificationManager = new NotificationManager(io, pubClient);

// Middleware: Authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    
    const payload = verifyAccessToken(token);
    socket.data.user = {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
    };
    
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
});

// Connection handler
io.on('connection', async (socket: Socket) => {
  const user = socket.data.user;
  console.log(`User ${user.username} connected (${socket.id})`);
  
  // Join user's personal room
  socket.join(`user:${user.id}`);
  
  // Set user as online
  await presenceManager.setUserOnline(user.id, socket.id);
  
  // Send initial data
  socket.emit('connected', {
    userId: user.id,
    socketId: socket.id,
  });
  
  // Presence events
  socket.on('presence:update', async (status: string) => {
    await presenceManager.updateUserStatus(user.id, status);
  });
  
  socket.on('presence:get', async (userIds: string[], callback) => {
    const presence = await presenceManager.getBulkPresence(userIds);
    callback(presence);
  });
  
  // Room events
  socket.on('room:join', async (roomId: string) => {
    await roomManager.joinRoom(socket, roomId);
  });
  
  socket.on('room:leave', async (roomId: string) => {
    await roomManager.leaveRoom(socket, roomId);
  });
  
  socket.on('room:message', async (data: {
    roomId: string;
    message: any;
  }) => {
    await roomManager.sendToRoom(socket, data.roomId, 'room:message', {
      userId: user.id,
      username: user.username,
      message: data.message,
      timestamp: new Date(),
    });
  });
  
  // Typing indicators
  socket.on('typing:start', (data: { roomId: string }) => {
    socket.to(`room:${data.roomId}`).emit('user:typing', {
      userId: user.id,
      username: user.username,
      isTyping: true,
    });
  });
  
  socket.on('typing:stop', (data: { roomId: string }) => {
    socket.to(`room:${data.roomId}`).emit('user:typing', {
      userId: user.id,
      username: user.username,
      isTyping: false,
    });
  });
  
  // Notifications
  socket.on('notification:markRead', async (notificationId: string) => {
    await notificationManager.markAsRead(user.id, notificationId);
  });
  
  // Disconnect handler
  socket.on('disconnect', async (reason) => {
    console.log(`User ${user.username} disconnected (${reason})`);
    
    // Set user as offline
    await presenceManager.setUserOffline(user.id);
    
    // Leave all rooms
    await roomManager.handleDisconnect(socket);
  });
});

// Utility function to emit to specific user
export async function emitToUser(userId: string, event: string, data: any) {
  io.to(`user:${userId}`).emit(event, data);
}

// Utility function to emit to room
export async function emitToRoom(roomId: string, event: string, data: any) {
  io.to(`room:${roomId}`).emit(event, data);
}

// Start server
const PORT = process.env.REALTIME_PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Realtime server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing connections...');
  
  io.close(() => {
    console.log('All connections closed');
    process.exit(0);
  });
});
```

**Checklist**:
- [ ] Set up Socket.io server
- [ ] Configure Redis adapter
- [ ] Add authentication middleware
- [ ] Handle connection events
- [ ] Implement presence system
- [ ] Add room management
- [ ] Handle typing indicators
- [ ] Implement graceful shutdown

#### 2. `/services/realtime/src/managers/presence.manager.ts`

**Purpose**: Manage user presence and status

**Dependencies**:
- Socket.io
- Redis

**Implementation**:
```typescript
import { Server } from 'socket.io';
import Redis from 'ioredis';

interface UserPresence {
  userId: string;
  socketId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
  devices: string[];
}

export class PresenceManager {
  private readonly PRESENCE_TTL = 300; // 5 minutes
  private readonly PRESENCE_PREFIX = 'presence:';
  
  constructor(
    private io: Server,
    private redis: Redis
  ) {}
  
  async setUserOnline(userId: string, socketId: string): Promise<void> {
    // Get current presence
    const existingPresence = await this.getUserPresence(userId);
    
    // Update devices list
    const devices = existingPresence?.devices || [];
    if (!devices.includes(socketId)) {
      devices.push(socketId);
    }
    
    // Update presence
    const presence: UserPresence = {
      userId,
      socketId,
      status: 'online',
      lastSeen: new Date(),
      devices,
    };
    
    // Store in Redis
    await this.redis.setex(
      `${this.PRESENCE_PREFIX}${userId}`,
      this.PRESENCE_TTL,
      JSON.stringify(presence)
    );
    
    // Notify followers
    await this.notifyPresenceChange(userId, 'online');
  }
  
  async setUserOffline(userId: string): Promise<void> {
    const presence = await this.getUserPresence(userId);
    if (!presence) return;
    
    // Update presence
    presence.status = 'offline';
    presence.lastSeen = new Date();
    
    // Store with longer TTL for offline status
    await this.redis.setex(
      `${this.PRESENCE_PREFIX}${userId}`,
      86400, // 24 hours
      JSON.stringify(presence)
    );
    
    // Notify followers
    await this.notifyPresenceChange(userId, 'offline');
  }
  
  async updateUserStatus(
    userId: string,
    status: 'online' | 'away' | 'busy'
  ): Promise<void> {
    const presence = await this.getUserPresence(userId);
    if (!presence) return;
    
    presence.status = status;
    presence.lastSeen = new Date();
    
    await this.redis.setex(
      `${this.PRESENCE_PREFIX}${userId}`,
      this.PRESENCE_TTL,
      JSON.stringify(presence)
    );
    
    await this.notifyPresenceChange(userId, status);
  }
  
  async getUserPresence(userId: string): Promise<UserPresence | null> {
    const data = await this.redis.get(`${this.PRESENCE_PREFIX}${userId}`);
    return data ? JSON.parse(data) : null;
  }
  
  async getBulkPresence(userIds: string[]): Promise<Record<string, UserPresence>> {
    if (userIds.length === 0) return {};
    
    const pipeline = this.redis.pipeline();
    userIds.forEach(userId => {
      pipeline.get(`${this.PRESENCE_PREFIX}${userId}`);
    });
    
    const results = await pipeline.exec();
    const presenceMap: Record<string, UserPresence> = {};
    
    results?.forEach((result, index) => {
      if (result[1]) {
        presenceMap[userIds[index]] = JSON.parse(result[1] as string);
      }
    });
    
    return presenceMap;
  }
  
  async removeDevice(userId: string, socketId: string): Promise<void> {
    const presence = await this.getUserPresence(userId);
    if (!presence) return;
    
    // Remove device from list
    presence.devices = presence.devices.filter(id => id !== socketId);
    
    // If no more devices, set offline
    if (presence.devices.length === 0) {
      await this.setUserOffline(userId);
    } else {
      // Update presence
      await this.redis.setex(
        `${this.PRESENCE_PREFIX}${userId}`,
        this.PRESENCE_TTL,
        JSON.stringify(presence)
      );
    }
  }
  
  private async notifyPresenceChange(
    userId: string,
    status: string
  ): Promise<void> {
    // Get user's followers (would query from database)
    const followers = await this.getUserFollowers(userId);
    
    // Notify each follower
    followers.forEach(followerId => {
      this.io.to(`user:${followerId}`).emit('presence:changed', {
        userId,
        status,
        timestamp: new Date(),
      });
    });
  }
  
  private async getUserFollowers(userId: string): Promise<string[]> {
    // This would query the database for followers
    // For now, return empty array
    return [];
  }
  
  // Heartbeat to keep presence alive
  startHeartbeat(): void {
    setInterval(async () => {
      // Get all online users
      const keys = await this.redis.keys(`${this.PRESENCE_PREFIX}*`);
      
      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          const presence: UserPresence = JSON.parse(data);
          
          if (presence.status === 'online') {
            // Refresh TTL
            await this.redis.expire(key, this.PRESENCE_TTL);
          }
        }
      }
    }, 60000); // Every minute
  }
}
```

**Checklist**:
- [ ] Implement online/offline status
- [ ] Handle multiple devices
- [ ] Add status updates
- [ ] Store presence in Redis
- [ ] Implement bulk presence fetch
- [ ] Add presence notifications
- [ ] Handle device removal
- [ ] Add heartbeat mechanism

#### 3. `/apps/web/src/hooks/useRealtimeConnection.ts`

**Purpose**: Hook for managing real-time connection

**Dependencies**:
- Socket.io client
- Authentication

**Implementation**:
```typescript
import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';
import { useToast } from './useToast';

interface UseRealtimeOptions {
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
}

interface RealtimeState {
  socket: Socket | null;
  connected: boolean;
  connecting: boolean;
  error: Error | null;
}

export function useRealtimeConnection(options: UseRealtimeOptions = {}) {
  const {
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
  } = options;
  
  const { user, accessToken } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<RealtimeState>({
    socket: null,
    connected: false,
    connecting: false,
    error: null,
  });
  
  const socketRef = useRef<Socket | null>(null);
  
  const connect = useCallback(() => {
    if (!user || !accessToken) {
      setState(prev => ({
        ...prev,
        error: new Error('Authentication required'),
      }));
      return;
    }
    
    setState(prev => ({ ...prev, connecting: true, error: null }));
    
    const socket = io(process.env.NEXT_PUBLIC_REALTIME_URL || 'http://localhost:5000', {
      auth: {
        token: accessToken,
      },
      transports: ['websocket'],
      reconnection,
      reconnectionAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    
    socket.on('connect', () => {
      console.log('Connected to realtime server');
      setState({
        socket,
        connected: true,
        connecting: false,
        error: null,
      });
      
      toast({
        title: 'Connected',
        description: 'Real-time features are now active',
      });
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Disconnected from realtime server:', reason);
      setState(prev => ({
        ...prev,
        connected: false,
      }));
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        socket.connect();
      }
    });
    
    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setState(prev => ({
        ...prev,
        connecting: false,
        error,
      }));
      
      if (error.message === 'Invalid token') {
        toast({
          title: 'Authentication Error',
          description: 'Please sign in again',
          variant: 'destructive',
        });
      }
    });
    
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      toast({
        title: 'Connection Error',
        description: 'Real-time features may be unavailable',
        variant: 'destructive',
      });
    });
    
    socketRef.current = socket;
    
    return socket;
  }, [user, accessToken, reconnection, reconnectionAttempts, toast]);
  
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setState({
        socket: null,
        connected: false,
        connecting: false,
        error: null,
      });
    }
  }, []);
  
  // Auto-connect when user is available
  useEffect(() => {
    if (autoConnect && user && accessToken && !socketRef.current) {
      connect();
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [autoConnect, user, accessToken, connect]);
  
  // Presence management
  const updatePresence = useCallback((status: 'online' | 'away' | 'busy') => {
    if (state.socket && state.connected) {
      state.socket.emit('presence:update', status);
    }
  }, [state.socket, state.connected]);
  
  const getPresence = useCallback(
    (userIds: string[]): Promise<Record<string, any>> => {
      return new Promise((resolve, reject) => {
        if (!state.socket || !state.connected) {
          reject(new Error('Not connected'));
          return;
        }
        
        state.socket.emit('presence:get', userIds, (presence: Record<string, any>) => {
          resolve(presence);
        });
      });
    },
    [state.socket, state.connected]
  );
  
  // Room management
  const joinRoom = useCallback((roomId: string) => {
    if (state.socket && state.connected) {
      state.socket.emit('room:join', roomId);
    }
  }, [state.socket, state.connected]);
  
  const leaveRoom = useCallback((roomId: string) => {
    if (state.socket && state.connected) {
      state.socket.emit('room:leave', roomId);
    }
  }, [state.socket, state.connected]);
  
  const sendToRoom = useCallback((roomId: string, message: any) => {
    if (state.socket && state.connected) {
      state.socket.emit('room:message', { roomId, message });
    }
  }, [state.socket, state.connected]);
  
  // Typing indicators
  const startTyping = useCallback((roomId: string) => {
    if (state.socket && state.connected) {
      state.socket.emit('typing:start', { roomId });
    }
  }, [state.socket, state.connected]);
  
  const stopTyping = useCallback((roomId: string) => {
    if (state.socket && state.connected) {
      state.socket.emit('typing:stop', { roomId });
    }
  }, [state.socket, state.connected]);
  
  return {
    ...state,
    connect,
    disconnect,
    updatePresence,
    getPresence,
    joinRoom,
    leaveRoom,
    sendToRoom,
    startTyping,
    stopTyping,
  };
}

// Context provider for global realtime connection
import { createContext, useContext, ReactNode } from 'react';

interface RealtimeContextValue extends ReturnType<typeof useRealtimeConnection> {}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const realtime = useRealtimeConnection({ autoConnect: true });
  
  return (
    <RealtimeContext.Provider value={realtime}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
}
```

**Checklist**:
- [ ] Create Socket.io connection
- [ ] Handle authentication
- [ ] Manage connection state
- [ ] Add auto-reconnection
- [ ] Implement presence methods
- [ ] Add room management
- [ ] Handle typing indicators
- [ ] Create context provider

#### 4. `/apps/web/src/components/features/presence/PresenceIndicator.tsx`

**Purpose**: Show user online/offline status

**Dependencies**:
- Realtime hook
- UI components

**Implementation**:
```typescript
import { useEffect, useState } from 'react';
import { useRealtime } from '@/hooks/useRealtimeConnection';
import { cn } from '@/lib/utils';

interface PresenceIndicatorProps {
  userId: string;
  showStatus?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface UserPresence {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
}

const statusColors = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
  offline: 'bg-gray-400',
};

const statusLabels = {
  online: 'Online',
  away: 'Away',
  busy: 'Busy',
  offline: 'Offline',
};

const sizeClasses = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
};

export function PresenceIndicator({
  userId,
  showStatus = false,
  size = 'md',
  className,
}: PresenceIndicatorProps) {
  const { socket, connected, getPresence } = useRealtime();
  const [presence, setPresence] = useState<UserPresence | null>(null);
  
  useEffect(() => {
    if (!connected || !userId) return;
    
    // Fetch initial presence
    getPresence([userId])
      .then((presenceMap) => {
        if (presenceMap[userId]) {
          setPresence(presenceMap[userId]);
        }
      })
      .catch(console.error);
    
    // Listen for presence changes
    const handlePresenceChange = (data: {
      userId: string;
      status: string;
      timestamp: Date;
    }) => {
      if (data.userId === userId) {
        setPresence((prev) => ({
          ...prev!,
          userId: data.userId,
          status: data.status as UserPresence['status'],
          lastSeen: data.timestamp,
        }));
      }
    };
    
    socket?.on('presence:changed', handlePresenceChange);
    
    return () => {
      socket?.off('presence:changed', handlePresenceChange);
    };
  }, [socket, connected, userId, getPresence]);
  
  const status = presence?.status || 'offline';
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <div
          className={cn(
            'rounded-full',
            statusColors[status],
            sizeClasses[size],
            status === 'online' && 'animate-pulse'
          )}
        />
        {status === 'online' && (
          <div
            className={cn(
              'absolute inset-0 rounded-full',
              statusColors[status],
              'animate-ping opacity-75'
            )}
          />
        )}
      </div>
      
      {showStatus && (
        <span className="text-sm text-muted-foreground">
          {statusLabels[status]}
          {status === 'offline' && presence?.lastSeen && (
            <span className="ml-1">
              ({formatLastSeen(presence.lastSeen)})
            </span>
          )}
        </span>
      )}
    </div>
  );
}

function formatLastSeen(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return new Date(date).toLocaleDateString();
}

// Presence list component
interface PresenceListProps {
  userIds: string[];
  showOffline?: boolean;
}

export function PresenceList({ userIds, showOffline = true }: PresenceListProps) {
  const { getPresence, connected } = useRealtime();
  const [presenceMap, setPresenceMap] = useState<Record<string, UserPresence>>({});
  
  useEffect(() => {
    if (!connected || userIds.length === 0) return;
    
    getPresence(userIds)
      .then(setPresenceMap)
      .catch(console.error);
  }, [connected, userIds, getPresence]);
  
  const onlineUsers = userIds.filter(
    (id) => presenceMap[id]?.status === 'online'
  );
  const offlineUsers = userIds.filter(
    (id) => !presenceMap[id] || presenceMap[id].status === 'offline'
  );
  
  return (
    <div className="space-y-4">
      {onlineUsers.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Online ({onlineUsers.length})</h4>
          <div className="space-y-2">
            {onlineUsers.map((userId) => (
              <div key={userId} className="flex items-center gap-2">
                <PresenceIndicator userId={userId} />
                {/* User info would go here */}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {showOffline && offlineUsers.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 text-muted-foreground">
            Offline ({offlineUsers.length})
          </h4>
          <div className="space-y-2 opacity-60">
            {offlineUsers.map((userId) => (
              <div key={userId} className="flex items-center gap-2">
                <PresenceIndicator userId={userId} />
                {/* User info would go here */}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Checklist**:
- [ ] Create presence indicator component
- [ ] Fetch user presence status
- [ ] Listen for presence changes
- [ ] Show status with colors
- [ ] Add pulse animation for online
- [ ] Format last seen time
- [ ] Create presence list component
- [ ] Handle offline users

---

## Phase 6: Blockchain Integration

### 🎯 Goals & Objectives
- Deploy smart contracts
- Integrate wallet connection
- Implement NFT minting
- Add token functionality

### 📁 Files to Complete

#### 1. `/packages/contracts/contracts/SparkleToken.sol`

**Purpose**: Main platform token contract

**Implementation**: See the comprehensive smart contract implementation in the PAD

**Checklist**:
- [ ] Implement ERC20 token
- [ ] Add staking mechanism
- [ ] Implement rewards system
- [ ] Add governance functions
- [ ] Include burn mechanism
- [ ] Add pause functionality
- [ ] Implement role-based access
- [ ] Add events for tracking

#### 2. `/packages/contracts/scripts/deploy.ts`

**Purpose**: Deployment script for contracts

**Dependencies**:
- `hardhat`
- `ethers`

**Implementation**:
```typescript
import { ethers, upgrades } from 'hardhat';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Starting deployment...');
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());
  
  // Deploy SparkleToken
  console.log('\nDeploying SparkleToken...');
  const SparkleToken = await ethers.getContractFactory('SparkleToken');
  const sparkleToken = await upgrades.deployProxy(SparkleToken, [], {
    initializer: 'initialize',
    kind: 'uups',
  });
  await sparkleToken.deployed();
  console.log('SparkleToken deployed to:', sparkleToken.address);
  
  // Deploy SparkleNFT
  console.log('\nDeploying SparkleNFT...');
  const SparkleNFT = await ethers.getContractFactory('SparkleNFT');
  const sparkleNFT = await upgrades.deployProxy(SparkleNFT, [], {
    initializer: 'initialize',
    kind: 'uups',
  });
  await sparkleNFT.deployed();
  console.log('SparkleNFT deployed to:', sparkleNFT.address);
  
  // Deploy Marketplace
  console.log('\nDeploying SparkleMarketplace...');
  const SparkleMarketplace = await ethers.getContractFactory('SparkleMarketplace');
  const marketplace = await upgrades.deployProxy(
    SparkleMarketplace,
    [
      sparkleNFT.address,
      sparkleToken.address,
      250, // 2.5% platform fee
      deployer.address, // fee recipient
    ],
    {
      initializer: 'initialize',
      kind: 'uups',
    }
  );
  await marketplace.deployed();
  console.log('SparkleMarketplace deployed to:', marketplace.address);
  
  // Grant roles
  console.log('\nGranting roles...');
  const MINTER_ROLE = await sparkleToken.MINTER_ROLE();
  await sparkleToken.grantRole(MINTER_ROLE, deployer.address);
  console.log('Granted MINTER_ROLE to deployer');
  
  const NFT_MINTER_ROLE = await sparkleNFT.MINTER_ROLE();
  await sparkleNFT.grantRole(NFT_MINTER_ROLE, marketplace.address);
  console.log('Granted NFT MINTER_ROLE to marketplace');
  
  // Mint initial token supply
  console.log('\nMinting initial token supply...');
  const initialSupply = ethers.utils.parseEther('100000000'); // 100M tokens
  await sparkleToken.mint(deployer.address, initialSupply);
  console.log('Minted', ethers.utils.formatEther(initialSupply), 'SPARK tokens');
  
  // Save deployment addresses
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    contracts: {
      SparkleToken: sparkleToken.address,
      SparkleNFT: sparkleNFT.address,
      SparkleMarketplace: marketplace.address,
    },
    blockNumber: await ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString(),
  };
  
  const deploymentPath = path.join(
    __dirname,
    '..',
    'deployments',
    `${network.name}.json`
  );
  
  fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log('\nDeployment completed!');
  console.log('Deployment info saved to:', deploymentPath);
  
  // Verify contracts on Etherscan (if not local network)
  if (network.name !== 'hardhat' && network.name !== 'localhost') {
    console.log('\nWaiting for block confirmations...');
    await sparkleToken.deployTransaction.wait(5);
    
    console.log('Verifying contracts on Etherscan...');
    await verifyContract(sparkleToken.address, []);
    await verifyContract(sparkleNFT.address, []);
    await verifyContract(marketplace.address, [
      sparkleNFT.address,
      sparkleToken.address,
      250,
      deployer.address,
    ]);
  }
}

async function verifyContract(address: string, constructorArguments: any[]) {
  try {
    await run('verify:verify', {
      address,
      constructorArguments,
    });
    console.log(`Contract ${address} verified`);
  } catch (error: any) {
    if (error.message.includes('already verified')) {
      console.log(`Contract ${address} already verified`);
    } else {
      console.error(`Error verifying ${address}:`, error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

**Checklist**:
- [ ] Deploy upgradeable contracts
- [ ] Initialize contracts properly
- [ ] Grant necessary roles
- [ ] Mint initial supply
- [ ] Save deployment addresses
- [ ] Verify on Etherscan
- [ ] Handle different networks
- [ ] Add error handling

#### 3. `/services/blockchain/src/blockchain.service.ts`

**Purpose**: Blockchain service for interacting with contracts

**Dependencies**:
- `ethers`
- Contract ABIs

**Implementation**:
```typescript
import { ethers, Contract, Signer } from 'ethers';
import { 
  SparkleToken__factory,
  SparkleNFT__factory,
  SparkleMarketplace__factory 
} from '../typechain';
import deployments from '../deployments/polygon.json';

export interface BlockchainConfig {
  rpcUrl: string;
  chainId: number;
  privateKey?: string;
}

export interface TransactionResult {
  hash: string;
  blockNumber: number;
  gasUsed: string;
  status: 'success' | 'failed';
}

export class BlockchainService {
  private provider: ethers.providers.JsonRpcProvider;
  private signer: Signer | null = null;
  private contracts: {
    token: Contract;
    nft: Contract;
    marketplace: Contract;
  };
  
  constructor(config: BlockchainConfig) {
    // Initialize provider
    this.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    
    // Initialize signer if private key provided
    if (config.privateKey) {
      this.signer = new ethers.Wallet(config.privateKey, this.provider);
    }
    
    // Initialize contracts
    this.contracts = {
      token: SparkleToken__factory.connect(
        deployments.contracts.SparkleToken,
        this.signer || this.provider
      ),
      nft: SparkleNFT__factory.connect(
        deployments.contracts.SparkleNFT,
        this.signer || this.provider
      ),
      marketplace: SparkleMarketplace__factory.connect(
        deployments.contracts.SparkleMarketplace,
        this.signer || this.provider
      ),
    };
  }
  
  // Token functions
  async getTokenBalance(address: string): Promise<string> {
    const balance = await this.contracts.token.balanceOf(address);
    return ethers.utils.formatEther(balance);
  }
  
  async getStakedBalance(address: string): Promise<string> {
    const staked = await this.contracts.token.stakedBalance(address);
    return ethers.utils.formatEther(staked);
  }
  
  async getPendingRewards(address: string): Promise<string> {
    const rewards = await this.contracts.token.pendingRewards(address);
    return ethers.utils.formatEther(rewards);
  }
  
  async stakeTokens(amount: string): Promise<TransactionResult> {
```typescript
    if (!this.signer) throw new Error('Signer required for transactions');
    
    const amountWei = ethers.utils.parseEther(amount);
    const tx = await this.contracts.token.stake(amountWei);
    const receipt = await tx.wait();
    
    return {
      hash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? 'success' : 'failed',
    };
  }
  
  async unstakeTokens(amount: string): Promise<TransactionResult> {
    if (!this.signer) throw new Error('Signer required for transactions');
    
    const amountWei = ethers.utils.parseEther(amount);
    const tx = await this.contracts.token.unstake(amountWei);
    const receipt = await tx.wait();
    
    return {
      hash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? 'success' : 'failed',
    };
  }
  
  async claimRewards(): Promise<TransactionResult> {
    if (!this.signer) throw new Error('Signer required for transactions');
    
    const tx = await this.contracts.token.claimRewards();
    const receipt = await tx.wait();
    
    return {
      hash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? 'success' : 'failed',
    };
  }
  
  // NFT functions
  async mintNFT(
    to: string,
    uri: string,
    contentType: number,
    royaltyPercentage: number
  ): Promise<{ tokenId: string; txResult: TransactionResult }> {
    if (!this.signer) throw new Error('Signer required for transactions');
    
    const tx = await this.contracts.nft.mintNFT(
      to,
      uri,
      contentType,
      royaltyPercentage
    );
    const receipt = await tx.wait();
    
    // Extract token ID from events
    const event = receipt.events?.find(
      (e: any) => e.event === 'NFTMinted'
    );
    const tokenId = event?.args?.tokenId.toString();
    
    return {
      tokenId,
      txResult: {
        hash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'success' : 'failed',
      },
    };
  }
  
  async getNFTMetadata(tokenId: string): Promise<{
    uri: string;
    creator: string;
    createdAt: Date;
    contentType: number;
    isLocked: boolean;
  }> {
    const metadata = await this.contracts.nft.tokenMetadata(tokenId);
    
    return {
      uri: metadata.uri,
      creator: metadata.creator,
      createdAt: new Date(metadata.createdAt.toNumber() * 1000),
      contentType: metadata.contentType,
      isLocked: metadata.isLocked,
    };
  }
  
  async ownerOf(tokenId: string): Promise<string> {
    return await this.contracts.nft.ownerOf(tokenId);
  }
  
  // Marketplace functions
  async listNFT(tokenId: string, price: string): Promise<TransactionResult> {
    if (!this.signer) throw new Error('Signer required for transactions');
    
    // First approve marketplace to transfer NFT
    const approveTx = await this.contracts.nft.approve(
      this.contracts.marketplace.address,
      tokenId
    );
    await approveTx.wait();
    
    // List NFT
    const priceWei = ethers.utils.parseEther(price);
    const tx = await this.contracts.marketplace.listNFT(tokenId, priceWei);
    const receipt = await tx.wait();
    
    return {
      hash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? 'success' : 'failed',
    };
  }
  
  async buyNFT(tokenId: string): Promise<TransactionResult> {
    if (!this.signer) throw new Error('Signer required for transactions');
    
    // Get listing details
    const listing = await this.contracts.marketplace.listings(tokenId);
    
    // Approve token spending
    const approveTx = await this.contracts.token.approve(
      this.contracts.marketplace.address,
      listing.price
    );
    await approveTx.wait();
    
    // Buy NFT
    const tx = await this.contracts.marketplace.buyNFT(tokenId);
    const receipt = await tx.wait();
    
    return {
      hash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? 'success' : 'failed',
    };
  }
  
  async getListingDetails(tokenId: string): Promise<{
    seller: string;
    price: string;
    isActive: boolean;
    listedAt: Date;
  } | null> {
    const listing = await this.contracts.marketplace.listings(tokenId);
    
    if (!listing.isActive) {
      return null;
    }
    
    return {
      seller: listing.seller,
      price: ethers.utils.formatEther(listing.price),
      isActive: listing.isActive,
      listedAt: new Date(listing.listedAt.toNumber() * 1000),
    };
  }
  
  // Utility functions
  async estimateGas(
    contractName: 'token' | 'nft' | 'marketplace',
    method: string,
    params: any[]
  ): Promise<string> {
    const contract = this.contracts[contractName];
    const gasEstimate = await contract.estimateGas[method](...params);
    return gasEstimate.toString();
  }
  
  async getCurrentGasPrice(): Promise<string> {
    const gasPrice = await this.provider.getGasPrice();
    return ethers.utils.formatUnits(gasPrice, 'gwei');
  }
  
  async waitForTransaction(hash: string): Promise<TransactionResult> {
    const receipt = await this.provider.waitForTransaction(hash);
    
    return {
      hash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? 'success' : 'failed',
    };
  }
  
  // Event listeners
  onTokenTransfer(
    callback: (from: string, to: string, amount: string) => void
  ): () => void {
    const filter = this.contracts.token.filters.Transfer();
    
    const listener = (from: string, to: string, amount: ethers.BigNumber) => {
      callback(from, to, ethers.utils.formatEther(amount));
    };
    
    this.contracts.token.on(filter, listener);
    
    // Return cleanup function
    return () => {
      this.contracts.token.off(filter, listener);
    };
  }
  
  onNFTMinted(
    callback: (tokenId: string, creator: string, owner: string) => void
  ): () => void {
    const filter = this.contracts.nft.filters.NFTMinted();
    
    const listener = (
      tokenId: ethers.BigNumber,
      creator: string,
      owner: string
    ) => {
      callback(tokenId.toString(), creator, owner);
    };
    
    this.contracts.nft.on(filter, listener);
    
    return () => {
      this.contracts.nft.off(filter, listener);
    };
  }
}

// Export factory function
export function createBlockchainService(
  config: BlockchainConfig
): BlockchainService {
  return new BlockchainService(config);
}
```

**Checklist**:
- [ ] Initialize provider and signer
- [ ] Connect to deployed contracts
- [ ] Implement token functions
- [ ] Add NFT minting/transfer
- [ ] Create marketplace methods
- [ ] Add gas estimation
- [ ] Implement event listeners
- [ ] Handle transaction receipts

#### 4. `/apps/web/src/components/features/wallet/WalletConnect.tsx`

**Purpose**: Wallet connection component

**Dependencies**:
- `ethers`
- `wagmi` or custom implementation

**Implementation**:
```typescript
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Wallet, LogOut, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { formatAddress } from '@/lib/utils';

interface WalletConnectProps {
  onConnect?: (address: string, provider: ethers.providers.Provider) => void;
  onDisconnect?: () => void;
}

const SUPPORTED_CHAIN_ID = 137; // Polygon Mainnet
const SUPPORTED_CHAIN_NAME = 'Polygon';

export function WalletConnect({ onConnect, onDisconnect }: WalletConnectProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    // Check if already connected
    checkConnection();
    
    // Setup event listeners
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);
  
  const checkConnection = async () => {
    if (!window.ethereum) return;
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        const { chainId } = await provider.getNetwork();
        
        setAddress(address);
        setChainId(chainId);
        
        onConnect?.(address, provider);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };
  
  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnect();
    } else {
      setAddress(accounts[0]);
      checkConnection();
    }
  };
  
  const handleChainChanged = (chainId: string) => {
    setChainId(parseInt(chainId, 16));
    window.location.reload();
  };
  
  const connectMetaMask = async () => {
    if (!window.ethereum) {
      toast({
        title: 'MetaMask not found',
        description: 'Please install MetaMask to continue',
        variant: 'destructive',
      });
      return;
    }
    
    setIsConnecting(true);
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Request accounts
      await provider.send('eth_requestAccounts', []);
      
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const { chainId } = await provider.getNetwork();
      
      // Check if on correct network
      if (chainId !== SUPPORTED_CHAIN_ID) {
        await switchNetwork();
      }
      
      setAddress(address);
      setChainId(chainId);
      setShowWalletDialog(false);
      
      onConnect?.(address, provider);
      
      toast({
        title: 'Wallet connected',
        description: `Connected to ${formatAddress(address)}`,
      });
    } catch (error: any) {
      console.error('Connection error:', error);
      
      if (error.code === 4001) {
        toast({
          title: 'Connection cancelled',
          description: 'You rejected the connection request',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Connection failed',
          description: error.message || 'Failed to connect wallet',
          variant: 'destructive',
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };
  
  const switchNetwork = async () => {
    if (!window.ethereum) return;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${SUPPORTED_CHAIN_ID.toString(16)}` }],
      });
    } catch (error: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${SUPPORTED_CHAIN_ID.toString(16)}`,
                chainName: 'Polygon Mainnet',
                nativeCurrency: {
                  name: 'MATIC',
                  symbol: 'MATIC',
                  decimals: 18,
                },
                rpcUrls: ['https://polygon-rpc.com'],
                blockExplorerUrls: ['https://polygonscan.com'],
              },
            ],
          });
        } catch (addError) {
          throw new Error('Failed to add network');
        }
      } else {
        throw error;
      }
    }
  };
  
  const disconnect = () => {
    setAddress(null);
    setChainId(null);
    onDisconnect?.();
    
    toast({
      title: 'Wallet disconnected',
      description: 'Your wallet has been disconnected',
    });
  };
  
  if (address) {
    return (
      <div className="flex items-center gap-2">
        {chainId !== SUPPORTED_CHAIN_ID && (
          <Button
            variant="destructive"
            size="sm"
            onClick={switchNetwork}
          >
            Wrong Network
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Wallet className="h-4 w-4" />
          {formatAddress(address)}
          <ChevronDown className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={disconnect}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }
  
  return (
    <>
      <Button
        onClick={() => setShowWalletDialog(true)}
        className="flex items-center gap-2"
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
      
      <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
            <DialogDescription>
              Connect your wallet to access blockchain features
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={connectMetaMask}
              disabled={isConnecting}
            >
              <img
                src="/images/metamask.svg"
                alt="MetaMask"
                className="h-5 w-5 mr-2"
              />
              {isConnecting ? 'Connecting...' : 'MetaMask'}
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              disabled
            >
              <img
                src="/images/walletconnect.svg"
                alt="WalletConnect"
                className="h-5 w-5 mr-2"
              />
              WalletConnect (Coming Soon)
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              disabled
            >
              <img
                src="/images/coinbase.svg"
                alt="Coinbase"
                className="h-5 w-5 mr-2"
              />
              Coinbase Wallet (Coming Soon)
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            By connecting a wallet, you agree to our Terms of Service and
            acknowledge that you have read our Privacy Policy.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

**Checklist**:
- [ ] Detect MetaMask installation
- [ ] Handle wallet connection
- [ ] Check and switch networks
- [ ] Display connected address
- [ ] Handle account changes
- [ ] Handle chain changes
- [ ] Add disconnect function
- [ ] Show connection dialog

---

## Phase 7: Advanced Features

### 🎯 Goals & Objectives
- Implement 3D virtual spaces
- Add AR features
- Create gamification system
- Build advanced search

### 📁 Files to Complete

#### 1. `/packages/3d-engine/src/VirtualSpace.tsx`

**Purpose**: 3D virtual space component

**Dependencies**:
- `@react-three/fiber`
- `@react-three/drei`
- `three`

**Implementation**:
```typescript
import { Canvas } from '@react-three/fiber';
import { 
  Sky, 
  Environment, 
  ContactShadows,
  OrbitControls,
  PerspectiveCamera,
  Stats
} from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { Suspense, useRef, useState } from 'react';
import { Room } from './components/Room';
import { Avatar } from './components/Avatar';
import { InteractiveObject } from './components/InteractiveObject';
import { LoadingScreen } from './components/LoadingScreen';
import { useVirtualSpace } from './hooks/useVirtualSpace';

interface VirtualSpaceProps {
  roomId: string;
  userId: string;
}

export function VirtualSpace({ roomId, userId }: VirtualSpaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [debug, setDebug] = useState(false);
  
  const {
    room,
    participants,
    objects,
    isLoading,
    error,
    moveAvatar,
    interactWithObject,
  } = useVirtualSpace(roomId, userId);
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">Error loading virtual space: {error.message}</p>
      </div>
    );
  }
  
  return (
    <div className="relative w-full h-full">
      <Canvas
        ref={canvasRef}
        shadows
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance'
        }}
        className="w-full h-full"
      >
        <PerspectiveCamera
          makeDefault
          position={[0, 5, 10]}
          fov={60}
          near={0.1}
          far={1000}
        />
        
        {/* Lighting */}
        <Sky 
          distance={450000}
          sunPosition={[100, 20, 100]}
          inclination={0}
          azimuth={0.25}
        />
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        
        <Suspense fallback={<LoadingScreen />}>
          <Physics debug={debug} gravity={[0, -9.81, 0]}>
            {/* Room environment */}
            {room && <Room data={room} />}
            
            {/* Participants */}
            {participants.map((participant) => (
              <Avatar
                key={participant.id}
                user={participant}
                position={participant.position}
                rotation={participant.rotation}
                isCurrentUser={participant.id === userId}
                onMove={moveAvatar}
              />
            ))}
            
            {/* Interactive objects */}
            {objects.map((object) => (
              <InteractiveObject
                key={object.id}
                {...object}
                onInteract={(action) => interactWithObject(object.id, action)}
              />
            ))}
          </Physics>
          
          {/* Ground */}
          <ContactShadows
            position={[0, -0.01, 0]}
            opacity={0.4}
            scale={20}
            blur={2}
            far={4}
          />
          
          <Environment preset="city" />
        </Suspense>
        
        <OrbitControls
          makeDefault
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={3}
          maxDistance={20}
        />
        
        {debug && <Stats />}
      </Canvas>
      
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 space-y-2">
        <div className="bg-black/50 text-white px-3 py-2 rounded">
          <p className="text-sm">Room: {room?.name || 'Loading...'}</p>
          <p className="text-xs">Participants: {participants.length}</p>
        </div>
        
        <button
          onClick={() => setDebug(!debug)}
          className="bg-black/50 text-white px-3 py-1 rounded text-sm hover:bg-black/70"
        >
          {debug ? 'Hide' : 'Show'} Debug
        </button>
      </div>
      
      {/* Controls help */}
      <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-2 rounded text-sm">
        <p>🖱️ Click + Drag: Rotate camera</p>
        <p>📱 Pinch: Zoom</p>
        <p>⌨️ WASD: Move avatar</p>
      </div>
    </div>
  );
}

// Room component
// /packages/3d-engine/src/components/Room.tsx
import { useGLTF } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';

interface RoomProps {
  data: {
    id: string;
    name: string;
    modelUrl: string;
    scale?: number;
  };
}

export function Room({ data }: RoomProps) {
  const { scene } = useGLTF(data.modelUrl);
  
  return (
    <RigidBody type="fixed" colliders="trimesh">
      <primitive 
        object={scene} 
        scale={data.scale || 1}
        position={[0, 0, 0]}
      />
    </RigidBody>
  );
}

// Avatar component
// /packages/3d-engine/src/components/Avatar.tsx
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Html } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import { Vector3, Euler } from 'three';
import { useKeyboardControls } from '../hooks/useKeyboardControls';

interface AvatarProps {
  user: {
    id: string;
    username: string;
    avatarUrl: string;
  };
  position: [number, number, number];
  rotation: [number, number, number];
  isCurrentUser: boolean;
  onMove: (position: Vector3, rotation: Euler) => void;
}

export function Avatar({ 
  user, 
  position, 
  rotation, 
  isCurrentUser,
  onMove 
}: AvatarProps) {
  const group = useRef<any>();
  const { scene, animations } = useGLTF(user.avatarUrl);
  const { actions, mixer } = useAnimations(animations, scene);
  const [currentAnimation, setCurrentAnimation] = useState('idle');
  
  const controls = useKeyboardControls();
  const velocity = useRef(new Vector3());
  
  useEffect(() => {
    actions[currentAnimation]?.play();
    
    return () => {
      actions[currentAnimation]?.stop();
    };
  }, [currentAnimation, actions]);
  
  useFrame((state, delta) => {
    if (!isCurrentUser || !group.current) return;
    
    // Handle movement
    const speed = 5;
    velocity.current.set(0, 0, 0);
    
    if (controls.forward) velocity.current.z -= speed * delta;
    if (controls.backward) velocity.current.z += speed * delta;
    if (controls.left) velocity.current.x -= speed * delta;
    if (controls.right) velocity.current.x += speed * delta;
    
    if (velocity.current.length() > 0) {
      setCurrentAnimation('walk');
      
      // Apply movement
      group.current.position.add(velocity.current);
      
      // Rotate to face movement direction
      const angle = Math.atan2(velocity.current.x, velocity.current.z);
      group.current.rotation.y = angle;
      
      // Notify server
      onMove(
        group.current.position.clone(),
        group.current.rotation.clone()
      );
    } else {
      setCurrentAnimation('idle');
    }
  });
  
  return (
    <RigidBody
      ref={group}
      position={position}
      rotation={rotation}
      type={isCurrentUser ? 'dynamic' : 'kinematicPosition'}
      enabledRotations={[false, true, false]}
    >
      <primitive object={scene} scale={1.8} />
      
      <Html position={[0, 2.5, 0]} center>
        <div className="bg-black/80 text-white px-2 py-1 rounded text-sm whitespace-nowrap">
          {user.username}
          {isCurrentUser && ' (You)'}
        </div>
      </Html>
    </RigidBody>
  );
}
```

**Checklist**:
- [ ] Set up Three.js canvas
- [ ] Add physics engine
- [ ] Create room environment
- [ ] Implement avatar system
- [ ] Add movement controls
- [ ] Handle multiplayer sync
- [ ] Add interactive objects
- [ ] Implement camera controls

#### 2. `/packages/gamification/src/services/achievement.service.ts`

**Purpose**: Achievement and gamification system

**Dependencies**:
- Database models
- Event system

**Implementation**:
```typescript
import { prisma } from '@sparkle/database';
import { EventEmitter } from 'events';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'posting' | 'social' | 'exploration' | 'special';
  points: number;
  requirement: AchievementRequirement;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface AchievementRequirement {
  type: string;
  value: number;
  metadata?: Record<string, any>;
}

export interface UserAchievement {
  userId: string;
  achievementId: string;
  unlockedAt: Date;
  progress: number;
  completed: boolean;
}

export class AchievementService extends EventEmitter {
  private achievements: Map<string, Achievement> = new Map();
  
  constructor() {
    super();
    this.loadAchievements();
  }
  
  private loadAchievements() {
    // Define all achievements
    const achievementList: Achievement[] = [
      // Posting achievements
      {
        id: 'first-post',
        name: 'First Steps',
        description: 'Create your first post',
        icon: '✍️',
        category: 'posting',
        points: 10,
        requirement: { type: 'posts_created', value: 1 },
        rarity: 'common',
      },
      {
        id: 'prolific-writer',
        name: 'Prolific Writer',
        description: 'Create 100 posts',
        icon: '📚',
        category: 'posting',
        points: 100,
        requirement: { type: 'posts_created', value: 100 },
        rarity: 'rare',
      },
      {
        id: 'viral-post',
        name: 'Going Viral',
        description: 'Get 1000 views on a single post',
        icon: '🔥',
        category: 'posting',
        points: 50,
        requirement: { type: 'post_views', value: 1000 },
        rarity: 'uncommon',
      },
      
      // Social achievements
      {
        id: 'social-butterfly',
        name: 'Social Butterfly',
        description: 'Follow 50 users',
        icon: '🦋',
        category: 'social',
        points: 25,
        requirement: { type: 'following_count', value: 50 },
        rarity: 'common',
      },
      {
        id: 'influencer',
        name: 'Influencer',
        description: 'Gain 1000 followers',
        icon: '⭐',
        category: 'social',
        points: 200,
        requirement: { type: 'followers_count', value: 1000 },
        rarity: 'epic',
      },
      {
        id: 'helpful-member',
        name: 'Helpful Member',
        description: 'Receive 100 thanks on your comments',
        icon: '🤝',
        category: 'social',
        points: 75,
        requirement: { type: 'thanks_received', value: 100 },
        rarity: 'uncommon',
      },
      
      // Exploration achievements
      {
        id: 'explorer',
        name: 'Explorer',
        description: 'Visit 10 different virtual spaces',
        icon: '🗺️',
        category: 'exploration',
        points: 30,
        requirement: { type: 'spaces_visited', value: 10 },
        rarity: 'common',
      },
      {
        id: 'treasure-hunter',
        name: 'Treasure Hunter',
        description: 'Find 5 hidden treasures in AR mode',
        icon: '💎',
        category: 'exploration',
        points: 100,
        requirement: { type: 'treasures_found', value: 5 },
        rarity: 'rare',
      },
      
      // Special achievements
      {
        id: 'early-adopter',
        name: 'Early Adopter',
        description: 'Join during the first month',
        icon: '🌟',
        category: 'special',
        points: 50,
        requirement: { 
          type: 'account_age', 
          value: 30,
          metadata: { comparison: 'less_than' }
        },
        rarity: 'rare',
      },
      {
        id: 'nft-collector',
        name: 'NFT Collector',
        description: 'Own 10 NFTs',
        icon: '🖼️',
        category: 'special',
        points: 150,
        requirement: { type: 'nfts_owned', value: 10 },
        rarity: 'epic',
      },
      {
        id: 'ai-whisperer',
        name: 'AI Whisperer',
        description: 'Have 1000 interactions with your AI companion',
        icon: '🤖',
        category: 'special',
        points: 100,
        requirement: { type: 'ai_interactions', value: 1000 },
        rarity: 'rare',
      },
    ];
    
    // Load into map
    achievementList.forEach(achievement => {
      this.achievements.set(achievement.id, achievement);
    });
  }
  
  async checkAchievements(userId: string, eventType: string, eventData: any) {
    // Get user's current achievements
    const userAchievements = await this.getUserAchievements(userId);
    const completed = new Set(
      userAchievements
        .filter(ua => ua.completed)
        .map(ua => ua.achievementId)
    );
    
    // Check each achievement
    for (const [id, achievement] of this.achievements) {
      // Skip if already completed
      if (completed.has(id)) continue;
      
      // Check if this event type matches the achievement requirement
      if (this.matchesRequirement(achievement.requirement, eventType, eventData)) {
        const progress = await this.calculateProgress(
          userId,
          achievement.requirement
        );
        
        if (progress >= achievement.requirement.value) {
          // Achievement unlocked!
          await this.unlockAchievement(userId, id);
        } else {
          // Update progress
          await this.updateProgress(userId, id, progress);
        }
      }
    }
  }
  
  private matchesRequirement(
    requirement: AchievementRequirement,
    eventType: string,
    eventData: any
  ): boolean {
    // Map event types to requirement types
    const eventMapping: Record<string, string[]> = {
      'post_created': ['posts_created'],
      'post_viewed': ['post_views'],
      'user_followed': ['following_count'],
      'follower_gained': ['followers_count'],
      'comment_thanked': ['thanks_received'],
      'space_visited': ['spaces_visited'],
      'treasure_found': ['treasures_found'],
      'nft_minted': ['nfts_owned'],
      'nft_purchased': ['nfts_owned'],
      'ai_interaction': ['ai_interactions'],
    };
    
    const mappedTypes = eventMapping[eventType] || [];
    return mappedTypes.includes(requirement.type);
  }
  
  private async calculateProgress(
    userId: string,
    requirement: AchievementRequirement
  ): Promise<number> {
    switch (requirement.type) {
      case 'posts_created':
        return await prisma.post.count({ where: { authorId: userId } });
        
      case 'following_count':
        return await prisma.follow.count({ where: { followerId: userId } });
        
      case 'followers_count':
        return await prisma.follow.count({ where: { followingId: userId } });
        
      case 'account_age':
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return 0;
        const days = Math.floor(
          (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        return requirement.metadata?.comparison === 'less_than' 
          ? days <= requirement.value ? requirement.value : 0
          : days;
        
      // Add more cases as needed
      default:
        return 0;
    }
  }
  
  private async unlockAchievement(userId: string, achievementId: string) {
    const achievement = this.achievements.get(achievementId);
    if (!achievement) return;
    
    // Create achievement record
    await prisma.userAchievement.create({
      data: {
        userId,
        achievementId,
        completed: true,
        progress: achievement.requirement.value,
        unlockedAt: new Date(),
      },
    });
    
    // Award points
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalPoints: { increment: achievement.points },
      },
    });
    
    // Emit event
    this.emit('achievement:unlocked', {
      userId,
      achievement,
      timestamp: new Date(),
    });
    
    // Send notification
    await this.sendAchievementNotification(userId, achievement);
  }
  
  private async updateProgress(
    userId: string,
    achievementId: string,
    progress: number
  ) {
    await prisma.userAchievement.upsert({
      where: {
        userId_achievementId: {
          userId,
          achievementId,
        },
      },
      update: {
        progress,
      },
      create: {
        userId,
        achievementId,
        progress,
        completed: false,
      },
    });
  }
  
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return await prisma.userAchievement.findMany({
      where: { userId },
    });
  }
  
  async getAchievementDetails(achievementId: string): Promise<Achievement | null> {
    return this.achievements.get(achievementId) || null;
  }
  
  async getLeaderboard(
    category?: string,
    limit: number = 100
  ): Promise<Array<{ userId: string; points: number; rank: number }>> {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        totalPoints: true,
      },
      orderBy: {
        totalPoints: 'desc',
      },
      take: limit,
    });
    
    return users.map((user, index) => ({
      userId: user.id,
      points: user.totalPoints,
      rank: index + 1,
    }));
  }
  
  private async sendAchievementNotification(
    userId: string,
    achievement: Achievement
  ) {
    // This would integrate with your notification service
    console.log(`Sending achievement notification to ${userId}:`, achievement);
  }
}

// Export singleton instance
export const achievementService = new AchievementService();
```

**Checklist**:
- [ ] Define achievement types
- [ ] Create progress tracking
- [ ] Implement unlock logic
- [ ] Add point system
- [ ] Create leaderboards
- [ ] Handle notifications
- [ ] Track user progress
- [ ] Emit achievement events

---

## Phase 8: Admin & Analytics

### 🎯 Goals & Objectives
- Build comprehensive admin dashboard
- Implement analytics tracking
- Create moderation tools
- Add reporting system

### 📁 Files to Complete

#### 1. `/apps/web/src/app/(admin)/admin/dashboard/page.tsx`

**Purpose**: Main admin dashboard

**Dependencies**:
- Analytics components
- Chart libraries

**Implementation**:
```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  FileText, 
  Activity, 
  DollarSign,
  TrendingUp,
  AlertCircle,
  Shield,
  BarChart3
} from 'lucide-react';
import { StatsCard } from '@/components/admin/StatsCard';
import { ActivityChart } from '@/components/admin/ActivityChart';
import { RecentActivity } from '@/components/admin/RecentActivity';
import { TopContent } from '@/components/admin/TopContent';
import { SystemHealth } from '@/components/admin/SystemHealth';
import { ModerationQueue } from '@/components/admin/ModerationQueue';

export default function AdminDashboard() {
  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  const { data: analytics } = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/analytics?period=7d', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
  });
  
  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor and manage your Sparkle Universe platform
        </p>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Users"
          value={stats?.users.total || 0}
          change={stats?.users.change || 0}
          changeLabel="from last week"
          icon={<Users className="h-4 w-4" />}
        />
        
        <StatsCard
          title="Active Posts"
          value={stats?.posts.total || 0}
          change={stats?.posts.change || 0}
          changeLabel="from last week"
          icon={<FileText className="h-4 w-4" />}
        />
        
        <StatsCard
          title="Daily Active Users"
          value={stats?.dau || 0}
          change={stats?.dauChange || 0}
          changeLabel="from yesterday"
          icon={<Activity className="h-4 w-4" />}
        />
        
        <StatsCard
          title="Revenue"
          value={`$${(stats?.revenue.total || 0).toFixed(2)}`}
          change={stats?.revenue.change || 0}
          changeLabel="from last month"
          icon={<DollarSign className="h-4 w-4" />}
          valueClassName="font-mono"
        />
      </div>
      
      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Activity</CardTitle>
                <CardDescription>
                  User engagement over the last 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityChart data={analytics?.activity || []} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>
                  Revenue breakdown by source
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RevenueChart data={analytics?.revenue || []} />
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest platform events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentActivity activities={stats?.recentActivity || []} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Content</CardTitle>
                <CardDescription>
                  Most popular posts this week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TopContent posts={stats?.topContent || []} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>
        
        <TabsContent value="content" className="space-y-4">
          <ContentManagement />
        </TabsContent>
        
        <TabsContent value="moderation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Moderation Queue
              </CardTitle>
              <CardDescription>
                Review reported content and take action
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ModerationQueue />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <AdvancedAnalytics />
        </TabsContent>
        
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                System Health
              </CardTitle>
              <CardDescription>
                Monitor system performance and health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SystemHealth />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-components for different sections
function UserManagement() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="flex gap-2">
          <Button variant="outline">Export Users</Button>
          <Button>Invite Users</Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <UserTable users={users?.users || []} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}

function ContentManagement() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Content Management</h2>
        <div className="flex gap-2">
          <Button variant="outline">Content Guidelines</Button>
          <Button>Featured Posts</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatsCard
          title="Total Posts"
          value="12,456"
          change={8.2}
          icon={<FileText className="h-4 w-4" />}
        />
        <StatsCard
          title="Comments"
          value="45,789"
          change={12.5}
          icon={<MessageSquare className="h-4 w-4" />}
        />
        <StatsCard
          title="Media Uploads"
          value="8,234"
          change={-2.3}
          icon={<Image className="h-4 w-4" />}
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Content Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ContentTable />
        </CardContent>
      </Card>
    </div>
  );
}

function AdvancedAnalytics() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Advanced Analytics</h2>
        <div className="flex gap-2">
          <DateRangePicker />
          <Button variant="outline">Export Report</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>User Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <RetentionChart />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Engagement Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelChart />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <GeoChart />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Platform Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceMetrics />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**Checklist**:
- [ ] Create dashboard layout
- [ ] Add key metrics cards
- [ ] Implement activity charts
- [ ] Add user management
- [ ] Create content overview
- [ ] Add moderation queue
- [ ] Implement analytics views
- [ ] Add system health monitoring

#### 2. `/services/analytics/src/analytics.service.ts`

**Purpose**: Analytics tracking service

**Dependencies**:
- Time series database
- Event tracking

**Implementation**:
```typescript
import { InfluxDB, Point, WriteApi } from '@influxdata/influxdb-client';
import { prisma } from '@sparkle/database';
import { Redis } from 'ioredis';

interface AnalyticsEvent {
  userId?: string;
  sessionId: string;
  eventType: string;
  eventData: Record<string, any>;
  timestamp: Date;
  metadata?: {
    ip?: string;
    userAgent?: string;
    referer?: string;
    country?: string;
    city?: string;
  };
}

interface MetricQuery {
  metric: string;
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
  timeRange: {
    start: Date;
    end: Date;
  };
  groupBy?: string[];
  filters?: Record<string, any>;
}

export class AnalyticsService {
  private influx: InfluxDB;
  private writeApi: WriteApi;
  private redis: Redis;
  
  constructor() {
    this.influx = new InfluxDB({
      url: process.env.INFLUXDB_URL!,
      token: process.env.INFLUXDB_TOKEN!,
    });
    
    this.writeApi = this.influx.getWriteApi(
      process.env.INFLUXDB_ORG!,
      process.env.INFLUXDB_BUCKET!,
      'ns' // nanosecond precision
    );
    
    this.redis = new Redis(process.env.REDIS_URL!);
  }
  
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // Write to InfluxDB
      const point = new Point('events')
        .tag('event_type', event.eventType)
        .tag('user_id', event.userId || 'anonymous')
        .tag('session_id', event.sessionId);
      
      // Add metadata as tags
      if (event.metadata) {
        if (event.metadata.country) {
          point.tag('country', event.metadata.country);
        }
        if (event.metadata.city) {
          point.tag('city', event.metadata.city);
        }
      }
      
      // Add event data as fields
      Object.entries(event.eventData).forEach(([key, value]) => {
        if (typeof value === 'number') {
          point.floatField(key, value);
        } else if (typeof value === 'boolean') {
          point.booleanField(key, value);
        } else {
          point.stringField(key, String(value));
        }
      });
      
      point.timestamp(event.timestamp);
      this.writeApi.writePoint(point);
      
      // Update real-time counters in Redis
      await this.updateRealtimeMetrics(event);
      
      // Store in PostgreSQL for detailed analysis
      await this.storeEventInDB(event);
      
    } catch (error) {
      console.error('Error tracking event:', error);
      // Don't throw - analytics shouldn't break the app
    }
  }
  
  private async updateRealtimeMetrics(event: AnalyticsEvent): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    // Update DAU (Daily Active Users)
    if (event.userId) {
      await this.redis.sadd(`dau:${today}`, event.userId);
      await this.redis.expire(`dau:${today}`, 86400 * 2); // 2 days
    }
    
    // Update event counters
    await this.redis.hincrby(`events:${today}`, event.eventType, 1);
    await this.redis.expire(`events:${today}`, 86400 * 7); // 7 days
    
    // Update hourly metrics
    const hour = new Date().getHours();
    await this.redis.hincrby(`events:${today}:${hour}`, event.eventType, 1);
    await this.redis.expire(`events:${today}:${hour}`, 86400); // 1 day
  }
  
  private async storeEventInDB(event: AnalyticsEvent): Promise<void> {
    await prisma.analyticsEvent.create({
      data: {
        userId: event.userId,
        sessionId: event.sessionId,
        eventType: event.eventType,
        eventData: event.eventData,
        ip: event.metadata?.ip,
        userAgent: event.metadata?.userAgent,
        referer: event.metadata?.referer,
        country: event.metadata?.country,
        city: event.metadata?.city,
        timestamp: event.timestamp,
      },
    });
  }
  
  async queryMetrics(query: MetricQuery): Promise<any[]> {
    const { metric, aggregation, timeRange, groupBy, filters } = query;
    
    let fluxQuery = `
      from(bucket: "${process.env.INFLUXDB_BUCKET}")
        |> range(start: ${timeRange.start.toISOString()}, stop: ${timeRange.end.toISOString()})
        |> filter(fn: (r) => r._measurement == "events")
    `;
    
    // Add filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        fluxQuery += `
          |> filter(fn: (r) => r.${key} == "${value}")
        `;
      });
    }
    
    // Add aggregation
    switch (aggregation) {
      case 'sum':
        fluxQuery += `|> sum()`;
        break;
      case 'avg':
        fluxQuery += `|> mean()`;
        break;
      case 'count':
        fluxQuery += `|> count()`;
        break;
      case 'min':
        fluxQuery += `|> min()`;
        break;
      case 'max':
        fluxQuery += `|> max()`;
        break;
    }
    
    // Add grouping
    if (groupBy && groupBy.length > 0) {
      fluxQuery += `|> group(columns: [${groupBy.map(g => `"${g}"`).join(', ')}])`;
    }
    
    const queryApi = this.influx.getQueryApi(process.env.INFLUXDB_ORG!);
    const results: any[] = [];
    
    await queryApi.collectRows(fluxQuery, (row) => {
      results.push(row);
    });
    
    return results;
  }
  
  async getDashboardStats(): Promise<{
    users: { total: number; change: number };
    posts: { total: number; change: number };
    dau: number;
    dauChange: number;
    revenue: { total: number; change: number };
    recentActivity: any[];
    topContent: any[];
  }> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
    const lastWeek = new Date(now.getTime() - 7 * 86400000);
    
    // Get user stats
    const [totalUsers, newUsersThisWeek, newUsersLastWeek] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: { gte: lastWeek },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(now.getTime() - 14 * 86400000),
            lt: lastWeek,
          },
        },
      }),
    ]);
    
    // Get post stats
    const [totalPosts, newPostsThisWeek, newPostsLastWeek] = await Promise.all([
      prisma.post.count({ where: { status: 'PUBLISHED' } }),
      prisma.post.count({
        where: {
          status: 'PUBLISHED',
          publishedAt: { gte: lastWeek },
        },
      }),
      prisma.post.count({
        where: {
          status: 'PUBLISHED',
          publishedAt: {
            gte: new Date(now.getTime() - 14 * 86400000),
            lt: lastWeek,
          },
        },
      }),
    ]);
    
    // Get DAU
    const [dauToday, dauYesterday] = await Promise.all([
      this.redis.scard(`dau:${today}`),
      this.redis.scard(`dau:${yesterday}`),
    ]);
    
    // Get revenue (simplified - would query payment system)
    const revenue = {
      total: 45678.90,
      change: 12.5,
    };
    
    // Get recent activity
    const recentActivity = await prisma.analyticsEvent.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            username: true,
            profile: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
    
    // Get top content
    const topContent = await prisma.post.findMany({
      take: 5,
      where: {
        status: 'PUBLISHED',
        publishedAt: { gte: lastWeek },
      },
      orderBy: {
        viewCount: 'desc',
      },
      include: {
        author: {
          select: {
            username: true,
          },
        },
      },
    });
    
    return {
      users: {
        total: totalUsers,
        change: calculatePercentageChange(newUsersThisWeek, newUsersLastWeek),
      },
      posts: {
        total: totalPosts,
        change: calculatePercentageChange(newPostsThisWeek, newPostsLastWeek),
      },
      dau: dauToday,
      dauChange: calculatePercentageChange(dauToday, dauYesterday),
      revenue,
      recentActivity,
      topContent,
    };
  }
  
  async getActivityChartData(days: number = 7): Promise<any[]> {
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 86400000);
      const dateStr = date.toISOString().split('T')[0];
      
      const [posts, comments, reactions] = await Promise.all([
        this.redis.hget(`events:${dateStr}`, 'post_created') || '0',
        this.redis.hget(`events:${dateStr}`, 'comment_created') || '0',
        this.redis.hget(`events:${dateStr}`, 'reaction_added') || '0',
      ]);
      
      data.push({
        date: dateStr,
        posts: parseInt(posts),
        comments: parseInt(comments),
        reactions: parseInt(reactions),
      });
    }
    
    return data;
  }
  
  // Cleanup old data
  async cleanup(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    await prisma.analyticsEvent.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
      },
    });
  }
}

function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// Export singleton
export const analyticsService = new AnalyticsService();
```

**Checklist**:
- [ ] Set up InfluxDB client
- [ ] Implement event tracking
- [ ] Add real-time metrics
- [ ] Create metric queries
- [ ] Build dashboard stats
- [ ] Add activity charts
- [ ] Implement data cleanup
- [ ] Handle error cases

---

## 🗄️ Database Schema

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create custom types
CREATE TYPE post_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'REMOVED');
CREATE TYPE content_type AS ENUM ('POST', 'ARTWORK', 'ACHIEVEMENT', 'COLLECTIBLE');
CREATE TYPE user_role AS ENUM ('USER', 'MODERATOR', 'ADMIN');
CREATE TYPE reaction_type AS ENUM ('LIKE', 'LOVE', 'LAUGH', 'WOW', 'SAD', 'ANGRY');
CREATE TYPE notification_type AS ENUM ('POST_LIKE', 'POST_COMMENT', 'FOLLOW', 'MENTION', 'ACHIEVEMENT', 'SYSTEM');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(30) UNIQUE NOT NULL,
    hashed_password TEXT,
    email_verified TIMESTAMP,
    role user_role DEFAULT 'USER',
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_-]+$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    location VARCHAR(100),
    website TEXT,
    pronouns VARCHAR(50),
    timezone VARCHAR(50) DEFAULT 'UTC',
    social_links JSONB,
    theme VARCHAR(20) DEFAULT 'system',
    accent_color VARCHAR(7) DEFAULT '#6366f1',
    is_public BOOLEAN DEFAULT TRUE,
    show_email BOOLEAN DEFAULT FALSE,
    
    CONSTRAINT valid_accent_color CHECK (accent_color ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- OAuth accounts table
CREATE TABLE oauth_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(provider, provider_account_id)
);

CREATE INDEX idx_oauth_accounts_user_id ON oauth_accounts(user_id);

-- AI Companions table
CREATE TABLE ai_companions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    personality JSONB NOT NULL,
    avatar_config JSONB NOT NULL,
    voice_id VARCHAR(100) NOT NULL,
    interactions INTEGER DEFAULT 0,
    last_interaction TIMESTAMP,
    learning_state JSONB,
    custom_traits JSONB,
    restrictions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_companions_user_id ON ai_companions(user_id);

-- Companion memories table with vector embeddings
CREATE TABLE companion_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    companion_id UUID NOT NULL REFERENCES ai_companions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB,
    importance FLOAT DEFAULT 1.0,
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_companion_memories_companion_id ON companion_memories(companion_id);
CREATE INDEX idx_companion_memories_created_at ON companion_memories(created_at);
CREATE INDEX idx_companion_memories_embedding ON companion_memories USING ivfflat (embedding vector_cosine_ops);

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id),
    icon VARCHAR(50),
    color VARCHAR(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- Tags table
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(30) UNIQUE NOT NULL,
    slug VARCHAR(30) UNIQUE NOT NULL,
    usage_count INTEGER DEFAULT 0
);

CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_usage_count ON tags(usage_count DESC);

-- Posts table
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(300) NOT NULL,
    slug VARCHAR(350) UNIQUE NOT NULL,
    content JSONB NOT NULL,
    excerpt TEXT,
    cover_image TEXT,
    category_id UUID REFERENCES categories(id),
    status post_status DEFAULT 'DRAFT',
    published_at TIMESTAMP,
    featured_at TIMESTAMP,
    view_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    reading_time INTEGER,
    sentiment FLOAT,
    ai_suggestions JSONB,
    nft_token_id VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT valid_sentiment CHECK (sentiment >= -1 AND sentiment <= 1)
);

CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_status_published ON posts(status, published_at);
CREATE INDEX idx_posts_category_id ON posts(category_id);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_posts_title_search ON posts USING gin(to_tsvector('english', title));

-- Post tags junction table
CREATE TABLE post_tags (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX idx_post_tags_tag_id ON post_tags(tag_id);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    edited_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- Reactions table
CREATE TABLE reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    reaction_type reaction_type NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT reaction_target CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    ),
    UNIQUE(user_id, post_id, reaction_type),
    UNIQUE(user_id, comment_id, reaction_type)
);

CREATE INDEX idx_reactions_user_id ON reactions(user_id);
CREATE INDEX idx_reactions_post_id ON reactions(post_id);
CREATE INDEX idx_reactions_comment_id ON reactions(comment_id);

-- Follows table
CREATE TABLE follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT no_self_follow CHECK (follower_id != following_id),
    UNIQUE(follower_id, following_id)
);

CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);

-- Wallets table
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id),
    address VARCHAR(42) UNIQUE NOT NULL,
    chain_id INTEGER NOT NULL,
    spark_balance DECIMAL(36, 18) DEFAULT 0,
    eth_balance DECIMAL(36, 18) DEFAULT 0,
    encrypted_key TEXT,
    is_external BOOLEAN DEFAULT TRUE,
    last_activity TIMESTAMP,
    total_gas_spent DECIMAL(36, 18) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_address CHECK (address ~ '^0x[a-fA-F0-9]{40}$')
);

CREATE INDEX idx_wallets_address ON wallets(address);
CREATE INDEX idx_wallets_user_id ON wallets(user_id);

-- NFTs table
CREATE TABLE nfts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id VARCHAR(100) UNIQUE NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    owner_address VARCHAR(42) NOT NULL,
    creator_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    animation_url TEXT,
    attributes JSONB,
    post_id UUID UNIQUE REFERENCES posts(id),
    is_listed BOOLEAN DEFAULT FALSE,
    list_price DECIMAL(36, 18),
    last_sale_price DECIMAL(36, 18),
    minted_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_nfts_token_id ON nfts(token_id);
CREATE INDEX idx_nfts_owner_address ON nfts(owner_address);
CREATE INDEX idx_nfts_creator_id ON nfts(creator_id);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    transaction_hash VARCHAR(66) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    value DECIMAL(36, 18) NOT NULL,
    gas_used DECIMAL(36, 18),
    gas_price DECIMAL(36, 18),
    block_number INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_hash ON transactions(transaction_hash);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- Reputation table
CREATE TABLE reputation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    badges JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reputation_user_id ON reputation(user_id);
CREATE INDEX idx_reputation_points ON reputation(points DESC);

-- Reputation history table
CREATE TABLE reputation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    metadata JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reputation_history_user_id ON reputation_history(user_id);
CREATE INDEX idx_reputation_history_timestamp ON reputation_history(timestamp);

-- Achievements table
CREATE TABLE achievements (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(10) NOT NULL,
    category VARCHAR(20) NOT NULL,
    points INTEGER NOT NULL,
    requirement JSONB NOT NULL,
    rarity VARCHAR(20) NOT NULL
);

-- User achievements table
CREATE TABLE user_achievements (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(50) NOT NULL REFERENCES achievements(id),
    progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMP,
    PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_completed ON user_achievements(completed);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Analytics events table (partitioned by month)
CREATE TABLE analytics_events (
    id UUID DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    session_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    ip INET,
    user_agent TEXT,
    referer TEXT,
    location GEOGRAPHY(Point, 4326),
    country VARCHAR(2),
    city VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- Create partitions for analytics events
CREATE TABLE analytics_events_2024_07 PARTITION OF analytics_events
    FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');

CREATE TABLE analytics_events_2024_08 PARTITION OF analytics_events
    FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');

-- Add more partitions as needed

CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id, timestamp);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type, timestamp);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);

-- Virtual spaces table
CREATE TABLE virtual_spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id),
    model_url TEXT NOT NULL,
    thumbnail_url TEXT,
    capacity INTEGER DEFAULT 50,
    is_public BOOLEAN DEFAULT TRUE,
    settings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_virtual_spaces_owner_id ON virtual_spaces(owner_id);
CREATE INDEX idx_virtual_spaces_is_public ON virtual_spaces(is_public);

-- Reports table for moderation
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id),
    content_type VARCHAR(20) NOT NULL,
    content_id UUID NOT NULL,
    reason VARCHAR(50) NOT NULL,
    details TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_content ON reports(content_type, content_id);
CREATE INDEX idx_reports_created_at ON reports(created_at);

-- Create update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_companions_updated_at BEFORE UPDATE ON ai_companions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nfts_updated_at BEFORE UPDATE ON nfts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reputation_updated_at BEFORE UPDATE ON reputation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_virtual_spaces_updated_at BEFORE UPDATE ON virtual_spaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function for full-text search
CREATE OR REPLACE FUNCTION search_posts(search_query TEXT)
RETURNS TABLE (
    id UUID,
    title VARCHAR(300),
    excerpt TEXT,
    author_id UUID,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.excerpt,
        p.author_id,
        ts_rank(
            to_tsvector('english', p.title || ' ' || COALESCE(p.excerpt, '')),
            plainto_tsquery('english', search_query)
        ) AS rank
    FROM posts p
    WHERE 
        p.status = 'PUBLISHED' AND
        p.deleted_at IS NULL AND
        to_tsvector('english', p.title || ' ' || COALESCE(p.excerpt, '')) @@ 
        plainto_tsquery('english', search_query)
    ORDER BY rank DESC
    LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for trending content
CREATE MATERIALIZED VIEW trending_posts AS
SELECT 
    p.id,
    p.title,
    p.slug,
    p.author_id,
    p.created_at,
    p.view_count,
    COUNT(DISTINCT r.id) as reaction_count,
    COUNT(DISTINCT c.id) as comment_count,
    (p.view_count * 0.3 + 
     COUNT(DISTINCT r.id) * 0.5 + 
     COUNT(DISTINCT c.id) * 0.2) as trending_score
FROM posts p
LEFT JOIN reactions r ON r.post_id = p.id
LEFT JOIN comments c ON c.post_id = p.id
WHERE 
    p.status = 'PUBLISHED' AND
    p.published_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
GROUP BY p.id
ORDER BY trending_score DESC
LIMIT 100;

CREATE INDEX idx_trending_posts_score ON trending_posts(trending_score DESC);

-- Refresh trending posts every hour
CREATE OR REPLACE FUNCTION refresh_trending_posts()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY trending_posts;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust based on your user setup)
GRANT USAGE ON SCHEMA public TO sparkle_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sparkle_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO sparkle_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO sparkle_app;
```

---

## 🎯 Conclusion

This comprehensive execution plan provides a clear, step-by-step guide for building the Sparkle Universe platform. Each phase builds upon the previous one, ensuring a solid foundation while progressively adding advanced features.

### Key Success Factors:
1. **Follow the phases in order** - Each phase depends on the previous ones
2. **Complete the checklists** - They ensure nothing is missed
3. **Test as you build** - Write tests alongside implementation
4. **Document thoroughly** - Future developers will thank you
5. **Review the interfaces** - Ensure components integrate properly

### Next Steps:
1. Set up your development environment
2. Start with Phase 1: Foundation & Infrastructure
3. Complete each file's checklist before moving on
4. Test integrations between components
5. Deploy incrementally as features are completed

Remember: This is a living document. As you build, you may discover optimizations or better approaches. Document these improvements and update the plan accordingly.

**Happy coding, and welcome to the future of digital communities! 🚀**
