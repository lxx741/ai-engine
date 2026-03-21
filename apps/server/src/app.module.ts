import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AppModule as ApplicationModule } from './modules/app/app.module';
import { ModelModule } from './modules/model/model.module';
import { ChatModule } from './modules/chat/chat.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { ToolModule } from './modules/tool/tool.module';
import { KnowledgeBaseModule } from './modules/knowledge-base/knowledge-base.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.test', '.env.local', '.env'],
      ignoreEnvVars: false,
      load: [() => ({
        API_PREFIX: process.env.API_PREFIX || '/api',
      })],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    PrismaModule,
    AuthModule,
    ApplicationModule,
    ModelModule,
    ChatModule,
    WorkflowModule,
    ToolModule,
    KnowledgeBaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
