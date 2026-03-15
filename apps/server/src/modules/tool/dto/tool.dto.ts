import { IsString, IsObject, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExecuteToolDto {
  @ApiPropertyOptional({
    description: 'Parameters for tool execution',
    type: Object,
  })
  @IsObject()
  @IsOptional()
  params?: Record<string, any>;
}

export class ToolResponseDto {
  @ApiProperty({ description: 'Tool name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Tool description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Tool parameters schema', type: Object })
  @IsObject()
  parameters: any;
}

export class ToolExecutionResponseDto {
  @ApiProperty({ description: 'Execution success status' })
  @IsBoolean()
  success: boolean;

  @ApiPropertyOptional({ description: 'Execution result data' })
  @IsObject()
  @IsOptional()
  data?: any;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  @IsString()
  @IsOptional()
  error?: string;
}
