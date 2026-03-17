import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from '../src/app.service';
import { CreateAppDto, UpdateAppDto } from '../src/modules/app/dto/app.dto';

/**
 * 测试专用 AppController
 * 不使用 ApiKeyGuard，用于 E2E 测试
 */
@ApiTags('Applications')
@Controller('apps')
export class AppTestController {
  constructor(private readonly appService: AppService) {}

  @Post()
  @ApiOperation({ summary: '创建 AI 应用' })
  @ApiResponse({ status: 201, description: '应用创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  create(@Body() createAppDto: CreateAppDto) {
    return this.appService.create(createAppDto);
  }

  @Get()
  @ApiOperation({ summary: '获取应用列表' })
  @ApiResponse({ status: 200, description: '返回应用列表' })
  findAll() {
    return this.appService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取应用详情' })
  @ApiResponse({ status: 200, description: '返回应用详情' })
  @ApiResponse({ status: 404, description: '应用不存在' })
  findOne(@Param('id') id: string) {
    return this.appService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新应用' })
  @ApiResponse({ status: 200, description: '应用更新成功' })
  @ApiResponse({ status: 404, description: '应用不存在' })
  update(@Param('id') id: string, @Body() updateAppDto: UpdateAppDto) {
    return this.appService.update(id, updateAppDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除应用' })
  @ApiResponse({ status: 200, description: '应用删除成功' })
  @ApiResponse({ status: 404, description: '应用不存在' })
  remove(@Param('id') id: string) {
    return this.appService.remove(id);
  }

  @Post(':id/regenerate-key')
  @ApiOperation({ summary: '重新生成 API Key' })
  @ApiResponse({ status: 200, description: 'API Key 重新生成成功' })
  @ApiResponse({ status: 404, description: '应用不存在' })
  regenerateApiKey(@Param('id') id: string) {
    return this.appService.regenerateApiKey(id);
  }
}
