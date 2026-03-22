# AGENTS.md - AI Agent Guidelines for ai-engine

## Project Overview

Enterprise AI Application Engine (like Coze/Dify) with NestJS backend and Next.js frontend.

**Structure:**

- `apps/server` - NestJS backend API
- `apps/web` - Next.js frontend (port 3001)
- `packages/core` - Core business logic
- `packages/providers` - LLM provider implementations (Aliyun, Ollama)
- `packages/shared` - Shared types and utilities

## Quick Commands

```bash
pnpm dev                    # Run both server and web
pnpm build                  # Build all packages
pnpm lint                   # Lint all packages
pnpm test                   # Run all tests

# Server
pnpm --filter @ai-engine/server dev
pnpm --filter @ai-engine/server build

# Web
pnpm --filter @ai-engine/web dev
pnpm --filter @ai-engine/web build

# Database
pnpm db:generate            # Prisma generate
pnpm db:migrate             # Prisma migrate dev
```

## Code Style Guidelines

详见 [代码规范](./docs/best-practices/code-style.md)。

## Architecture Patterns

**NestJS Backend:**

- Modules: Feature-based (`modules/chat`, `modules/workflow`)
- Services: Business logic, stateless, injectable
- Controllers: HTTP layer only
- DTOs: class-validator validation

**Next.js Frontend:**

- App Router: Next.js 14 app directory
- State: Zustand (client), TanStack Query (server)
- Styling: Tailwind CSS + shadcn/ui

## Database (Prisma)

```bash
pnpm --filter @ai-engine/server db:generate
pnpm --filter @ai-engine/server db:migrate
pnpm --filter @ai-engine/server db:migrate:prod  # Production
pnpm --filter @ai-engine/server db:studio
```

## Best Practices Documentation

- [📚 索引](./docs/best-practices/index.md)
- [代码规范](./docs/best-practices/code-style.md)
- [NestJS](./docs/best-practices/nestjs.md)
- [Next.js](./docs/best-practices/nextjs.md)
- [Prisma](./docs/best-practices/prisma.md)
- [Zustand](./docs/best-practices/zustand.md)
- [TanStack Query](./docs/best-practices/tanstack-query.md)
- [shadcn/ui](./docs/best-practices/shadcn-ui.md)

---

## Multi-Agent Configuration

### Hardware Profile

- **Max Concurrent Agents:** 3 (M4 16GB)
- **Memory per Agent:** ~500MB-1GB RAM

### Zero-Conflict Strategy

**Core Rule:** Agents NEVER modify the same file simultaneously.

**File Isolation Patterns:**

1. **New Files:** Each agent creates independent files - ✅ Safe
2. **Shared Components:** Use component isolation (e.g., `toolbar-buttons/`)
3. **Store Actions:** Each agent adds independent actions, merge sequentially

### Toolbar Buttons Pattern

```
apps/web/src/components/workflow/toolbar-buttons/
├── index.ts                    # Unified exports
├── template-library-button.tsx # Agent 1
├── undo-button.tsx             # Agent 2
├── redo-button.tsx             # Agent 2
├── auto-layout-button.tsx      # Agent 2
├── validate-button.tsx         # Agent 3
└── preview-button.tsx          # Agent 3
```

### Git Workflow

- **Branch Naming:** `feature/{function-name}`
- **Merge Strategy:** Sequential merge after tests pass
- **Testing:** Test immediately after each agent completes

### Quality Gates

Before merging:

- [ ] TypeScript compilation passes (`pnpm build`)
- [ ] ESLint passes (`pnpm lint`)
- [ ] Prettier formatted
- [ ] Tests pass

---

## Service Restart Protocol

**After Each Agent Completes:**

1. Stop services (Ctrl+C)
2. Clear caches: `rm -rf apps/web/.next apps/server/dist`
3. Restart: `pnpm dev`
4. Verify: http://localhost:3001

**Quick Commands:**

```bash
pnpm clean && pnpm dev                              # Full restart
lsof -ti:3000,3001 | xargs kill -9                  # Kill stuck processes
lsof -ti:3000 && echo "Backend OK" || echo "Down"   # Check backend
lsof -ti:3001 && echo "Frontend OK" || echo "Down"  # Check frontend
```
