# TanStack Query 最佳实践

## 基础查询

```typescript
import { useQuery } from '@tanstack/react-query';

function Todos() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const res = await fetch('/api/todos');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 分钟内视为新鲜
    gcTime: 10 * 60 * 1000,   // 10 分钟后从缓存删除
  });

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return <ul>{data.map(t => <li key={t.id}>{t.title}</li>)}</ul>;
}
```

**要点：**

- `queryKey` - 唯一标识查询（数组形式支持参数化）
- `staleTime` - 数据保持"新鲜"的时间
- `gcTime` - 无用数据从缓存清理的时间

## 参数化查询

```typescript
function Todo({ id }) {
  const { data } = useQuery({
    queryKey: ['todo', id],
    queryFn: () => fetch(`/api/todos/${id}`).then((r) => r.json()),
    enabled: !!id, // 条件查询
  });
}

// 依赖查询
function TodoDetails({ todoId }) {
  const { data: todo } = useQuery({
    queryKey: ['todo', todoId],
    queryFn: () => fetch(`/api/todos/${todoId}`).then((r) => r.json()),
  });

  const { data: comments } = useQuery({
    queryKey: ['comments', todoId],
    queryFn: () => fetch(`/api/comments?todoId=${todoId}`).then((r) => r.json()),
    enabled: !!todo, // 等待 todo 加载完成
  });
}
```

## 突变 (Mutations)

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function CreateTodo() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newTodo) => fetch('/api/todos', {
      method: 'POST',
      body: JSON.stringify(newTodo),
    }).then(r => r.json()),

    onSuccess: (data) => {
      // 无效化查询触发刷新
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  return (
    <button onClick={() => mutation.mutate({ title: 'New Todo' })}>
      Create
    </button>
  );
}
```

## 乐观更新

```typescript
useMutation({
  mutationFn: updateTodo,

  onMutate: async (newTodo, context) => {
    // 取消正在进行的查询
    await queryClient.cancelQueries({ queryKey: ['todos', newTodo.id] });

    // 快照之前的数据
    const previousTodo = queryClient.getQueryData(['todos', newTodo.id]);

    // 乐观更新
    queryClient.setQueryData(['todos', newTodo.id], newTodo);

    return { previousTodo, newTodo };
  },

  onError: (err, newTodo, context) => {
    // 回滚到快照
    queryClient.setQueryData(['todos', context.newTodo.id], context.previousTodo);
  },

  onSettled: (data, error, variables, context) => {
    // 最终同步（无论成功失败）
    queryClient.invalidateQueries({ queryKey: ['todos', variables.id] });
  },
});
```

**要点：**

- `onMutate` - 突变前执行，返回上下文
- `onError` - 失败时回滚
- `onSettled` - 最终同步

## 列表的乐观更新

```typescript
useMutation({
  mutationFn: addTodo,

  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] });

    const previousTodos = queryClient.getQueryData(['todos']);

    // 乐观添加到列表
    queryClient.setQueryData(['todos'], (old) => [...old, { ...newTodo, id: Date.now() }]);

    return { previousTodos };
  },

  onError: (err, newTodo, context) => {
    // 回滚列表
    queryClient.setQueryData(['todos'], context.previousTodos);
  },

  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  },
});
```

## 突变持久化（离线支持）

```typescript
// 设置默认突变
queryClient.setMutationDefaults(['addTodo'], {
  mutationFn: addTodo,
  onMutate: async (variables) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] });
    const optimisticTodo = { id: uuid(), ...variables };
    queryClient.setQueryData(['todos'], (old) => [...old, optimisticTodo]);
    return { optimisticTodo };
  },
  onSuccess: (result, variables, context) => {
    queryClient.setQueryData(['todos'], (old) =>
      old.map((todo) => (todo.id === context.optimisticTodo.id ? result : todo))
    );
  },
  onError: (error, variables, context) => {
    queryClient.setQueryData(['todos'], (old) =>
      old.filter((todo) => todo.id !== context.optimisticTodo.id)
    );
  },
  retry: 3,
});

// 脱水（应用关闭时保存状态）
const state = dehydrate(queryClient);

// 水合（应用启动时恢复）
hydrate(queryClient, state);

// 恢复暂停的突变
queryClient.resumePausedMutations();
```

## 查询客户端配置

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MyApp />
    </QueryClientProvider>
  );
}
```

## 并行查询

```typescript
// 使用 useQueries 批量查询
const users = useQueries({
  queries: userIds.map((id) => ({
    queryKey: ['user', id],
    queryFn: () => fetch(`/api/users/${id}`).then((r) => r.json()),
  })),
});

// 结果是与查询数组对应的结果数组
const user1 = users[0].data;
const user2 = users[1].data;
```

## 无限查询

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

function Projects() {
  const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery({
    queryKey: ['projects'],
    queryFn: ({ pageParam = 0 }) =>
      fetch(`/api/projects?cursor=${pageParam}`).then(r => r.json()),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  });

  return (
    <div>
      {data.pages.map((page, i) => (
        <div key={i}>{page.projects.map(p => <Project key={p.id} {...p} />)}</div>
      ))}
      <button onClick={() => fetchNextPage()} disabled={!hasNextPage || isFetching}>
        {isFetching ? 'Loading...' : hasNextPage ? 'Load More' : 'Nothing more'}
      </button>
    </div>
  );
}
```
