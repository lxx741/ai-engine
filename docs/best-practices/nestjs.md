# NestJS 最佳实践

## 模块组织

```typescript
@Module({
  imports: [DatabaseModule],
  controllers: [CatsController],
  providers: [CatsService],
  exports: [CatsService],
})
export class CatsModule {}
```

**要点：**

- 按功能特性划分模块（`modules/chat`、`modules/workflow`）
- 使用 `exports` 暴露给其他模块使用的提供者
- 全局模块使用 `@Global()` 装饰器

## 服务作用域

```typescript
// 默认单例
@Injectable()
export class CatsService {}

// 每请求新实例
@Injectable({ scope: Scope.REQUEST })
export class RequestScopedService {
  constructor(@Inject(REQUEST) private request: Request) {}
}

// 每次注入新实例
@Injectable({ scope: Scope.TRANSIENT })
export class TransientService {}
```

**要点：**

- 默认使用 `singleton`（整个应用共享）
- 需要请求上下文时使用 `Scope.REQUEST`
- 需要独立状态时使用 `Scope.TRANSIENT`

## 全局验证管道

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
    })
  );

  await app.listen(3000);
}
```

**要点：**

- `whitelist: true` - 自动剥离未装饰的属性
- `forbidNonWhitelisted: true` - 禁止未声明字段（返回 400）
- `transform: true` - 自动类型转换（字符串→数字等）
- 生产环境隐藏详细错误信息

## DTO 验证

```typescript
import { IsString, IsOptional, IsEmail, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateChatDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  description?: string;

  @IsEmail()
  email: string;
}
```

**要点：**

- 所有输入参数使用 DTO 验证
- 使用 `@Transform` 处理数据格式（trim、类型转换）
- 可选字段使用 `@IsOptional()`

## 异常处理

```typescript
// 自定义异常过滤器
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
    });
  }
}

// 控制器级别应用
@Controller('products')
@UseFilters(HttpExceptionFilter)
export class ProductsController {}
```

**要点：**

- 使用 `@Catch()` 创建统一异常处理
- 控制器级别使用 `@UseFilters()`
- 全局注册使用 `app.useGlobalFilters()`

## 日志记录

```typescript
private readonly logger = new Logger(ChatService.name);

try {
  await this.riskyOperation();
} catch (error) {
  this.logger.error(`Operation failed: ${error instanceof Error ? error.message : 'Unknown'}`);
  throw error;
}
```

**要点：**

- 每个服务/控制器使用静态 `name` 创建 Logger
- 记录错误时包含上下文信息
- 使用 Winston 进行结构化日志（生产环境）

## 依赖注入模式

```typescript
// 构造函数注入
export class CatsService {
  constructor(
    @InjectRepository(Cat)
    private catRepository: Repository<Cat>,
    private logger: Logger
  ) {}
}

// 动态模块配置
@Module({})
export class DatabaseModule {
  static forRoot(options: DatabaseOptions): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [{ provide: 'DATABASE_OPTIONS', useValue: options }, DatabaseService],
      exports: [DatabaseService],
    };
  }
}
```

**要点：**

- 优先使用构造函数注入
- 配置使用动态模块的 `forRoot()` 模式
- 使用 `@Inject('TOKEN')` 注入非类提供者
