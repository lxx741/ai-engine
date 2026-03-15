import { Module, Global } from '@nestjs/common';
import { ToolRegistry } from './tool.registry';
import { ToolService } from './tool.service';
import { ToolController } from './tool.controller';

@Global()
@Module({
  providers: [ToolRegistry, ToolService],
  exports: [ToolRegistry, ToolService],
  controllers: [ToolController],
})
export class ToolModule {}
