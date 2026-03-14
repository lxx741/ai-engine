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
import { ModelService } from './model.service';
import { CreateModelDto, UpdateModelDto } from './dto/model.dto';
import { ApiKeyGuard, Public } from '../../auth/api-key.guard';

@ApiTags('Models')
@Controller('models')
@UseGuards(ApiKeyGuard)
@ApiBearerAuth('X-API-Key')
export class ModelController {
  constructor(private readonly modelService: ModelService) {}

  @Post()
  @ApiOperation({ summary: '创建模型配置' })
  @ApiResponse({ status: 201, description: '模型创建成功' })
  create(@Body() createModelDto: CreateModelDto) {
    return this.modelService.create(createModelDto);
  }

  @Get()
  @ApiOperation({ summary: '获取模型列表' })
  @ApiResponse({ status: 200, description: '返回模型列表' })
  findAll() {
    return this.modelService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取模型详情' })
  @ApiResponse({ status: 200, description: '返回模型详情' })
  findOne(@Param('id') id: string) {
    return this.modelService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新模型' })
  @ApiResponse({ status: 200, description: '模型更新成功' })
  update(@Param('id') id: string, @Body() updateModelDto: UpdateModelDto) {
    return this.modelService.update(id, updateModelDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除模型' })
  @ApiResponse({ status: 200, description: '模型删除成功' })
  remove(@Param('id') id: string) {
    return this.modelService.remove(id);
  }

  @Get('default/active')
  @Public()
  @ApiOperation({ summary: '获取默认启用的模型' })
  @ApiResponse({ status: 200, description: '返回默认模型' })
  getDefaultModel() {
    return this.modelService.getDefaultModel();
  }
}
