import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAppDto, UpdateAppDto } from './dto/app.dto';
import { generateApiKey } from '../../common/utils';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async create(createAppDto: CreateAppDto) {
    const apiKey = generateApiKey();
    
    // Get default model (prefer Ollama if available)
    const defaultModel = await this.prisma.model.findFirst({
      where: { enabled: true, isDefault: true },
    });
    
    return this.prisma.app.create({
      data: {
        ...createAppDto,
        modelId: createAppDto.modelId || defaultModel?.id || 'ollama:qwen3.5:9b',
        apiKey,
        config: createAppDto.config || {},
      },
    });
  }

  async findAll() {
    return this.prisma.app.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const app = await this.prisma.app.findUnique({
      where: { id },
    });

    if (!app) {
      throw new NotFoundException(`App with id "${id}" not found`);
    }

    return app;
  }

  async update(id: string, updateAppDto: UpdateAppDto) {
    await this.findOne(id); // Verify exists

    return this.prisma.app.update({
      where: { id },
      data: updateAppDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Verify exists
    await this.prisma.app.delete({
      where: { id },
    });
    return { message: `App "${id}" deleted successfully` };
  }

  async regenerateApiKey(id: string) {
    await this.findOne(id);
    
    const newApiKey = generateApiKey();
    return this.prisma.app.update({
      where: { id },
      data: { apiKey: newApiKey },
    });
  }
}
