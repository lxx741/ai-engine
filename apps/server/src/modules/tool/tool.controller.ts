import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ToolService } from './tool.service';
import { ExecuteToolDto, ToolResponseDto, ToolExecutionResponseDto } from './dto/tool.dto';

@ApiTags('Tools')
@Controller('tools')
export class ToolController {
  constructor(private readonly toolService: ToolService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of all available tools' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of tools',
    type: [ToolResponseDto],
  })
  listTools() {
    return this.toolService.listTools();
  }

  @Get(':name')
  @ApiOperation({ summary: 'Get details of a specific tool' })
  @ApiParam({ name: 'name', description: 'Tool name' })
  @ApiResponse({
    status: 200,
    description: 'Returns tool details',
    type: ToolResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tool not found' })
  getTool(@Param('name') name: string) {
    const tool = this.toolService.getTool(name);
    if (!tool) {
      return { error: 'Tool not found' };
    }
    return tool;
  }

  @Post(':name/execute')
  @ApiOperation({ summary: 'Execute a tool with given parameters' })
  @ApiParam({ name: 'name', description: 'Tool name' })
  @ApiBody({
    description: 'Tool execution parameters',
    type: ExecuteToolDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Tool execution result',
    type: ToolExecutionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  @ApiResponse({ status: 404, description: 'Tool not found' })
  async executeTool(
    @Param('name') name: string,
    @Body() body: ExecuteToolDto,
  ) {
    return this.toolService.executeTool(name, body.params || {});
  }
}
