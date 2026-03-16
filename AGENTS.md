# AGENTS.md - AI Agent Guidelines for ai-engine

## Project Overview

Enterprise AI Application Engine (like Coze/Dify) with NestJS backend and Next.js frontend.

**Structure:**
- `apps/server` - NestJS backend API
- `apps/web` - Next.js frontend (port 3001)
- `packages/core` - Core business logic
- `packages/providers` - LLM provider implementations (Aliyun, Ollama)
- `packages/shared` - Shared types and utilities

## Build & Development Commands

### Root Level (pnpm workspace)
```bash
pnpm dev              # Run both server and web concurrently
pnpm dev:server       # Backend only (NestJS on default port)
pnpm dev:web          # Frontend only (Next.js on port 3001)
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm test             # Run all tests
```

### Server (apps/server)
```bash
pnpm --filter @ai-engine/server dev          # Dev mode with watch
pnpm --filter @ai-engine/server build        # Compile to dist/
pnpm --filter @ai-engine/server lint         # ESLint with auto-fix
pnpm --filter @ai-engine/server test         # Run Jest tests
pnpm --filter @ai-engine/server test:watch   # Watch mode
pnpm --filter @ai-engine/server test:cov     # With coverage
pnpm --filter @ai-engine/server db:generate  # Prisma generate
pnpm --filter @ai-engine/server db:migrate   # Prisma migrate dev
pnpm --filter @ai-engine/server db:seed      # Seed database
```

### Web (apps/web)
```bash
pnpm --filter @ai-engine/web dev      # Next.js dev server (port 3001)
pnpm --filter @ai-engine/web build    # Next.js build
pnpm --filter @ai-engine/web lint     # Next.js lint
```

### Running Single Tests
```bash
# Server - run specific test file
pnpm --filter @ai-engine/server test -- chat.service.spec.ts

# Server - run test by pattern
pnpm --filter @ai-engine/server test -- -t "ChatService"

# Server - watch single file
pnpm --filter @ai-engine/server test:watch chat.service.spec.ts

# Server - with coverage
pnpm --filter @ai-engine/server test:cov

# E2E tests
pnpm --filter @ai-engine/server test:e2e

# Packages (core, providers, shared)
pnpm --filter @ai-engine/core test -- variable-manager.spec.ts
pnpm --filter @ai-engine/providers test -- provider-factory.test.ts
```

## Code Style Guidelines

### TypeScript Configuration
- **Target:** ES2022 (server), ESNext (web)
- **Module:** CommonJS (server), ESM (web/Next.js)
- **Strict mode:** Server has relaxed strictness (strictNullChecks: false), web is fully strict
- **Path aliases:** @ai-engine/* (server packages), @/* (src shortcut)

### Import Conventions
1. **Order:** External packages → Internal modules → Relative imports
2. **NestJS:** Use barrel exports from @nestjs/common
3. **Internal:** Use path aliases (@ai-engine/core, @ai-engine/shared)
4. **Relative:** Use `.ts` extension omission

```typescript
// ✅ Correct
import { Module, Injectable } from '@nestjs/common';
import { getProviderFactory } from '@ai-engine/providers';
import { ChatMessage } from '@ai-engine/shared';
import { PrismaService } from '../../prisma/prisma.service';
```

### Naming Conventions
- **Files:** kebab-case for files, PascalCase for components/classes
- **Classes:** PascalCase (services, controllers, modules)
- **Interfaces:** PascalCase (often with suffix: `Service`, `Controller`, `Module`)
- **Types:** PascalCase
- **Variables/Functions:** camelCase
- **Constants:** UPPER_SNAKE_CASE
- **Private members:** No prefix convention enforced

### Formatting (Prettier)
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### Error Handling
1. **NestJS:** Use built-in HTTP exceptions and filters
2. **Async operations:** Try-catch with proper error logging
3. **Logger:** Use NestJS Logger class with static name
4. **Validation:** Use class-validator with class-transformer

```typescript
// ✅ Correct
private readonly logger = new Logger(ChatService.name);

try {
  await this.riskyOperation();
} catch (error) {
  this.logger.error(`Operation failed: ${error instanceof Error ? error.message : 'Unknown'}`);
  throw error;
}
```

### Testing Conventions
- **Framework:** Vitest (server), none configured for web yet
- **File naming:** `*.spec.ts` (NestJS convention), `*.test.ts` (packages)
- **Test structure:** describe/it blocks with descriptive names
- **Mocks:** Use vi.mock() for module mocking, vi.fn() for spies
- **Async tests:** Use async/await pattern
- **Setup:** Direct instantiation with mocked dependencies (not TestingModule)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@ai-engine/providers', async () => {
  const actual = await vi.importActual('@ai-engine/providers');
  return { ...actual, getProviderFactory: vi.fn(...) };
});

describe('ChatService', () => {
  let service: ChatService;
  
  beforeEach(() => {
    service = new ChatService(mockPrisma, mockConversation, mockMessage);
    vi.clearAllMocks();
  });
  
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

### Architecture Patterns

#### NestJS Backend
- **Modules:** Feature-based organization (`modules/chat`, `modules/workflow`)
- **Services:** Business logic, stateless, injectable
- **Controllers:** HTTP layer only, delegate to services
- **DTOs:** Use class-validator for input validation
- **Prisma:** Singleton service for database access

#### Next.js Frontend
- **App Router:** Using Next.js 14 app directory structure
- **Components:** Organized by feature (`components/chat/`)
- **Hooks:** Custom hooks in `hooks/` directory
- **State:** Zustand for client state, React Query for server state
- **Styling:** Tailwind CSS with shadcn/ui components

### Database (Prisma)
```bash
pnpm --filter @ai-engine/server db:generate   # Generate Prisma Client
pnpm --filter @ai-engine/server db:migrate    # Create and apply migration
pnpm --filter @ai-engine/server db:studio     # Open Prisma Studio GUI
```

### Environment Variables
- **Development:** `.env.local` (gitignored) or `.env`
- **Template:** `.env.example` for required variables
- **Loading:** @nestjs/config with envFilePath configuration

### Key Dependencies
- **Backend:** NestJS 10, Prisma 5, class-validator, winston
- **Frontend:** Next.js 14, React 18, TanStack Query, Zustand, shadcn/ui
- **Shared:** TypeScript 5, ESLint 8, Prettier 3

### Common Tasks
1. **Add new feature module:** Use NestJS CLI `nest g module modules/feature`
2. **Add provider:** Implement in `packages/providers/` and register in ProviderFactory
3. **Add API endpoint:** Create controller method with proper DTO validation
4. **Database change:** Update schema.prisma, run db:migrate, regenerate client
