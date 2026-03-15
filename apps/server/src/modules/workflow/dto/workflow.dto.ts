import { IsString, IsOptional, IsObject, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkflowDto {
  @ApiProperty({ description: '工作流所属应用 ID' })
  @IsString()
  @IsNotEmpty()
  appId: string;

  @ApiProperty({ description: '工作流名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: '工作流描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '工作流定义（DAG）' })
  @IsObject()
  @IsNotEmpty()
  definition: any;

  @ApiPropertyOptional({ 
    description: '工作流状态',
    enum: ['draft', 'published', 'archived'],
    default: 'draft' 
  })
  @IsEnum(['draft', 'published', 'archived'])
  @IsOptional()
  status?: string = 'draft';
}

export class UpdateWorkflowDto {
  @ApiPropertyOptional({ description: '工作流名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '工作流描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '工作流定义' })
  @IsObject()
  @IsOptional()
  definition?: any;

  @ApiPropertyOptional({ 
    description: '工作流状态',
    enum: ['draft', 'published', 'archived']
  })
  @IsEnum(['draft', 'published', 'archived'])
  @IsOptional()
  status?: string;
}

export class RunWorkflowDto {
  @ApiPropertyOptional({ description: '输入变量' })
  @IsObject()
  @IsOptional()
  input?: Record<string, any>;
}
