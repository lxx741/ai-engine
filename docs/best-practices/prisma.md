# Prisma 最佳实践

## 事务处理

### 顺序事务

```typescript
const [user, post] = await prisma.$transaction([
  prisma.user.create({
    data: { email: 'user@example.com', name: 'User' },
  }),
  prisma.post.create({
    data: {
      title: 'Post',
      author: { connect: { email: 'user@example.com' } },
    },
  }),
]);
```

### 交互式事务

```typescript
const transferResult = await prisma.$transaction(
  async (tx) => {
    const sender = await tx.account.update({
      where: { id: 1 },
      data: { balance: { decrement: 100 } },
    });

    if (sender.balance < 0) {
      throw new Error('Insufficient funds');
    }

    const receiver = await tx.account.update({
      where: { id: 2 },
      data: { balance: { increment: 100 } },
    });

    return { sender, receiver };
  },
  {
    maxWait: 5000,
    timeout: 10000,
    isolationLevel: 'Serializable',
  }
);
```

**要点：**

- 顺序事务：简单的操作列表，全部成功或全部失败
- 交互式事务：需要条件判断或复杂逻辑
- 配置选项：`maxWait`、`timeout`、`isolationLevel`

## 查询优化

### 选择性字段

```typescript
// ✅ 只获取需要的字段
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    posts: {
      select: { id: true, title: true },
      take: 5,
    },
  },
});
```

### 关联查询

```typescript
// 包含关联数据
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: {
      where: { published: true },
      include: { comments: true },
    },
  },
});
```

### 分页

```typescript
// 游标分页（推荐）
const posts = await prisma.post.findMany({
  take: 10,
  skip: 1,
  cursor: { id: lastSeenId },
  orderBy: { id: 'desc' },
});

// 偏移分页（简单场景）
const posts = await prisma.post.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
});
```

**要点：**

- 使用 `select` 只获取需要的字段
- 使用 `include` 获取关联数据
- 大数据量使用游标分页

## 批量操作

```typescript
// 批量创建
await prisma.user.createMany({
  data: [
    { email: 'a@example.com', name: 'A' },
    { email: 'b@example.com', name: 'B' },
  ],
  skipDuplicates: true,
});

// 批量更新
await prisma.user.updateMany({
  where: { role: 'USER' },
  data: { role: 'ADMIN' },
});

// 批量删除
await prisma.user.deleteMany({
  where: { createdAt: { lt: new Date('2023-01-01') } },
});
```

## 迁移命令

```bash
# 开发环境
pnpm db:generate          # 生成 Prisma Client
pnpm db:migrate           # 创建并应用迁移
pnpm db:migrate --create-only  # 仅创建迁移文件
pnpm db:studio            # 打开 Prisma Studio
pnpm db:seed              # 运行种子脚本

# 生产环境
pnpm db:migrate:prod      # 应用迁移（无提示）
```

## 迁移最佳实践

```prisma
// schema.prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  posts Post[]

  @@index([email])
  @@map('users')
}
```

**要点：**

- 使用 UUID 作为主键（分布式友好）
- 添加 `createdAt` / `updatedAt` 时间戳
- 为常用查询字段添加索引 `@@index`
- 使用 `@@map` 指定表名（单复数一致）

## 连接池配置

```typescript
// 生产环境连接池优化
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'info', 'warn', 'error'],
});

// 优雅关闭
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
```

## N+1 查询问题

```typescript
// ❌ 错误：N+1 查询
const users = await prisma.user.findMany();
for (const user of users) {
  user.posts = await prisma.post.findMany({
    where: { authorId: user.id },
  });
}

// ✅ 正确：使用 include
const users = await prisma.user.findMany({
  include: { posts: true },
});
```
