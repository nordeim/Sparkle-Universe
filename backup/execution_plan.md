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
    if (!this.signer) throw
