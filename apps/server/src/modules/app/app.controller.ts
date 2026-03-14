import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AppService } from './app.service';
import { CreateAppDto, UpdateAppDto } from './dto/app.dto';
import { ApiKeyGuard, Public } from '../../auth/api-key.guard';

@ApiTags('Applications')
@Controller('apps')
@UseGuards(ApiKeyGuard)
@ApiBearerAuth('X-API-Key')
export class AppController {
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
