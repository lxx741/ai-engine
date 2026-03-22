# 最佳实践文档索引

快速参考指南，涵盖项目使用的核心依赖库的最佳实践。

## 📚 文档列表

| 文档                                  | 描述                                      |
| ------------------------------------- | ----------------------------------------- |
| [代码规范](./code-style.md)           | TypeScript、命名、测试约定                |
| [NestJS](./nestjs.md)                 | 后端框架 - 模块、服务、验证、错误处理     |
| [Next.js](./nextjs.md)                | 前端框架 - App Router、数据获取、缓存策略 |
| [Prisma](./prisma.md)                 | ORM - 查询优化、事务、迁移                |
| [Zustand](./zustand.md)               | 状态管理 - Store 创建、中间件、持久化     |
| [TanStack Query](./tanstack-query.md) | 服务端状态 - 缓存、突变、乐观更新         |
| [shadcn/ui](./shadcn-ui.md)           | UI 组件 - 主题、定制、可访问性            |

## 🚀 快速参考

### NestJS

```typescript
// 全局验证管道
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  })
);
```

### Next.js 数据获取

```typescript
// 静态缓存
const data = await fetch('...', { cache: 'force-cache' });
// 动态获取
const data = await fetch('...', { cache: 'no-store' });
// 增量静态
const data = await fetch('...', { next: { revalidate: 10 } });
```

### Prisma 事务

```typescript
// 顺序事务
await prisma.$transaction([op1, op2]);
// 交互式事务
await prisma.$transaction(async (tx) => { ... });
```

### Zustand 持久化

```typescript
create(persist(
  (set) => ({...}),
  { name: 'storage-key', partialize: (state) => ({ key: state.key }) }
))
```

### TanStack Query 乐观更新

```typescript
useMutation({
  onMutate: async () => {
    /* 乐观更新 */
  },
  onError: () => {
    /* 回滚 */
  },
  onSettled: () => {
    /* 最终同步 */
  },
});
```
