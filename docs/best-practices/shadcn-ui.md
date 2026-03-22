# shadcn/ui 最佳实践

## 核心原则

1. **优先使用现有组件**

   ```bash
   npx shadcn@latest search
   npx shadcn@latest add button
   ```

2. **组合优于定制**

   ```tsx
   // ✅ 组合现有组件
   <Card>
     <CardHeader>
       <CardTitle>Title</CardTitle>
     </CardHeader>
     <CardContent>Content</CardContent>
   </Card>

   // ❌ 避免重新造轮子
   ```

3. **使用内置变体**

   ```tsx
   <Button variant="outline">Outline</Button>
   <Button variant="ghost">Ghost</Button>
   <Button variant="destructive">Delete</Button>
   <Button size="sm">Small</Button>
   <Button size="lg">Large</Button>
   ```

4. **语义化颜色**

   ```tsx
   // ✅ 使用 CSS 变量
   <div className="bg-primary text-primary-foreground" />
   <div className="bg-muted text-muted-foreground" />
   <div className="border-border" />

   // ❌ 避免硬编码颜色
   <div className="bg-slate-900 text-white" />
   ```

## 主题配置

### components.json

```json
{
  "style": "default",
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true
  },
  "rsc": true,
  "aliases": {
    "utils": "~/lib/utils",
    "components": "~/components"
  }
}
```

**配置选项：**

- `style`: `default` | `new-york`
- `baseColor`: `slate` | `gray` | `zinc` | `neutral` | `stone`
- `cssVariables`: `true` | `false`（是否使用 CSS 变量主题）

### CSS 变量主题

```css
/* globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    /* ... */
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    /* ... */
  }
}
```

## 暗黑模式

### Theme Provider

```typescript
// components/theme-provider.tsx
'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({ children, defaultTheme = 'system', ...props }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(system);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### Mode Toggle

```typescript
'use client';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## 表单模式

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  username: z.string().min(2).max(50),
  email: z.string().email(),
});

export function ProfileForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: '', email: '' },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="shadcn" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

## 对话框模式

```typescript
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function DeleteDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Edit Profile</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here.
          </DialogDescription>
        </DialogHeader>
        {/* Form content */}
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## 可访问性要点

```tsx
// ✅ 正确：使用 asChild 避免额外 DOM 节点
<DialogTrigger asChild>
  <Button>Edit</Button>
</DialogTrigger>

// ✅ 正确：添加屏幕阅读器文本
<Button variant="icon">
  <Settings className="h-4 w-4" />
  <span className="sr-only">Settings</span>
</Button>

// ✅ 正确：使用适当的 ARIA 标签
<nav aria-label="Main navigation">
  <ul>{/* ... */}</ul>
</nav>
```

## 自定义组件

```bash
# 添加官方组件
npx shadcn@latest add accordion
npx shadcn@latest add chart

# 搜索社区组件
npx shadcn@latest search
```

**自定义步骤：**

1. 复制组件到 `components/ui/`
2. 根据需要修改样式/行为
3. 保持 Radix UI 原语的可访问性
4. 使用语义化 CSS 变量
