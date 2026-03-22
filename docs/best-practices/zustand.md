# Zustand 最佳实践

## 基础 Store 创建

```typescript
import { create } from 'zustand';

interface BearState {
  bears: number;
  fishes: number;
  addBear: () => void;
  eatFish: () => void;
}

export const useBearStore = create<BearState>()((set, get) => ({
  bears: 0,
  fishes: 0,
  addBear: () => set({ bears: get().bears + 1 }),
  eatFish: () => set({ fishes: get().fishes - 1 }),
}));
```

**要点：**

- 使用 TypeScript 定义状态和动作接口
- `set` 用于更新状态
- `get` 用于获取当前状态（在动作中）

## 持久化中间件

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface State {
  bears: number;
  addBear: () => void;
}

export const useBearStore = create<State>()(
  persist(
    (set, get) => ({
      bears: 0,
      addBear: () => set({ bears: get().bears + 1 }),
    }),
    {
      name: 'bear-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ bears: state.bears }),
      version: 1,
      migrate: (persisted, version) => {
        if (version === 0) {
          persisted.bears = persisted.count ?? 0;
          delete persisted.count;
        }
        return persisted;
      },
    }
  )
);
```

**要点：**

- `name` - 存储键名（必须唯一）
- `storage` - 存储介质（默认 localStorage）
- `partialize` - 选择性持久化部分状态
- `version` + `migrate` - 状态版本迁移

## 手动控制水合

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create<State>()(
  persist((set) => ({ count: 0, increment: () => set((s) => ({ count: s.count + 1 })) }), {
    name: 'storage',
    skipHydration: true,
  })
);

// 手动触发水合
useStore.persist.rehydrate();

// 检查水合状态
const isHydrated = useStore.persist.hasHydrated();
```

**要点：**

- `skipHydration: true` - 跳过自动水合
- `rehydrate()` - 手动触发水合
- `hasHydrated()` - 检查是否已水合

## 多 Store 模式

```typescript
// 按功能拆分多个 store
export const useAuthStore = create<AuthState>()(persist(...));
export const useSettingsStore = create<SettingsState>()(...);
export const useWorkflowStore = create<WorkflowState>()(...);

// 组合使用
function Component() {
  const user = useAuthStore((s) => s.user);
  const theme = useSettingsStore((s) => s.theme);
  const nodes = useWorkflowStore((s) => s.nodes);
  return <div>{/* ... */}</div>;
}
```

**要点：**

- 按功能领域拆分多个 store
- 避免单一巨型 store
- 每个 store 独立持久化配置

## 选择器优化

```typescript
// ✅ 正确：使用选择器避免不必要的重渲染
const name = useBearStore((state) => state.bears);
const addBear = useBearStore((state) => state.addBear);

// ✅ 使用 shallow 比较对象
import { shallow } from 'zustand/shallow';
const { bears, fishes } = useBearStore(
  (state) => ({ bears: state.bears, fishes: state.fishes }),
  shallow
);

// ❌ 错误：整个 store 订阅
const state = useBearStore(); // 任何变化都会重渲染
```

## 中间件组合

```typescript
import { create } from 'zustand';
import { persist, devtools, immer } from 'zustand/middleware';

export const useStore = create<State>()(
  devtools(
    persist(
      immer((set) => ({
        // 使用 immer 可直接修改状态
        updateBear: (newBear) => {
          set((state) => {
            state.bears.push(newBear);
          });
        },
      })),
      { name: 'storage' }
    )
  )
);
```

**可用中间件：**

- `persist` - 持久化
- `devtools` - Redux DevTools 集成
- `immer` - 不可变更新（可变语法）
- `subscribeWithSelector` - 细粒度订阅
- `combine` - 类型推断辅助

## React 组件使用

```typescript
function BearCounter() {
  const bears = useBearStore((state) => state.bears);
  return <h1>{bears} bears around here...</h1>;
}

function BearActions() {
  const addBear = useBearStore((state) => state.addBear);
  return <button onClick={addBear}>Add bear</button>;
}

// 非组件中使用
const addBear = useBearStore.getState().addBear;
addBear();
```
