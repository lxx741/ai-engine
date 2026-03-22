# Next.js 最佳实践

## 数据获取策略

| 缓存配置                      | 行为                 | 等效 Pages Router               |
| ----------------------------- | -------------------- | ------------------------------- |
| `cache: 'force-cache'` (默认) | 构建时获取，静态缓存 | `getStaticProps`                |
| `cache: 'no-store'`           | 每请求获取           | `getServerSideProps`            |
| `next: { revalidate: N }`     | N 秒后重新验证       | `getStaticProps` + `revalidate` |

```typescript
export default async function Dashboard() {
  // 静态生成（默认）
  const staticData = await fetch('...', { cache: 'force-cache' });

  // 服务端渲染
  const dynamicData = await fetch('...', { cache: 'no-store' });

  // 增量静态生成
  const revalidatedData = await fetch('...', {
    next: { revalidate: 10 }
  });

  return <div>{/* ... */}</div>;
}
```

## Server Components 模式

```typescript
// ✅ 正确：Server Component 获取数据
async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    next: { revalidate: 60 }
  });
  return res.json();
}

export default async function BlogPage() {
  const posts = await getPosts();
  return <BlogClient posts={posts} />;
}

// Client Component 接收数据
'use client';
export function BlogClient({ posts }) {
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
}
```

**要点：**

- Server Components 负责数据获取
- Client Components 负责交互逻辑
- 通过 props 传递数据

## 缓存优化

```typescript
// 并行数据获取
export default async function Page() {
  const [users, posts, comments] = await Promise.all([
    fetch('...', { cache: 'force-cache' }),
    fetch('...', { cache: 'force-cache' }),
    fetch('...', { cache: 'force-cache' }),
  ]);
  return <div>{/* ... */}</div>;
}

// 依赖数据获取（串行）
export default async function Page() {
  const user = await fetch(`.../user/${userId}`);
  const posts = await fetch(`.../posts?author=${user.id}`);
  return <div>{/* ... */}</div>;
}
```

**要点：**

- 使用 `Promise.all()` 并行获取独立数据
- 依赖数据只能串行获取
- 使用 React Suspense 进行流式渲染

## 路由模式

```typescript
// 动态路由：app/blog/[slug]/page.tsx
export default async function BlogPost({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  return <div>{slug}</div>;
}

// 生成静态参数
export async function generateStaticParams() {
  const posts = await fetch('...').then(r => r.json());
  return posts.map((post) => ({ slug: post.slug }));
}
```

**要点：**

- 动态参数使用 `[param]` 目录
- `generateStaticParams()` 预生成静态页面
- params 在 Next.js 15 中是 Promise

## 服务端操作 (Server Actions)

```typescript
'use server';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  await db.post.create({ data: { title } });
  revalidatePath('/posts');
}

// 表单中使用
<form action={createPost}>
  <input name="title" />
  <button type="submit">Create</button>
</form>
```

**要点：**

- 使用 `'use server'` 标记服务端函数
- 可直接在组件中调用
- 使用 `revalidatePath()` 刷新缓存

## 错误处理

```typescript
// app/error.tsx
'use client';
export default function Error({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

**要点：**

- `error.tsx` 处理路由错误
- `not-found.tsx` 处理 404
- `global-error.tsx` 处理根布局错误

## 元数据 SEO

```typescript
export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description',
  openGraph: {
    title: 'OG Title',
    images: ['/og-image.png'],
  },
};

// 动态元数据
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await fetch(`.../${id}`).then((r) => r.json());
  return { title: post.title };
}
```
