import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateModelDto, UpdateModelDto } from './dto/model.dto';

@Injectable()
export class ModelService {
  constructor(private prisma: PrismaService) {}

  async create(createModelDto: CreateModelDto) {
    if (createModelDto.isDefault) {
      await this.prisma.model.updateMany({
        where: {},
        data: { isDefault: false },
      });
    }

    return this.prisma.model.create({
      data: createModelDto,
    });
  }

  async findAll() {
    return this.prisma.model.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const model = await this.prisma.model.findUnique({
      where: { id },
    });

    if (!model) {
      throw new NotFoundException(`Model with id "${id}" not found`);
    }

    return model;
  }

  async update(id: string, updateModelDto: UpdateModelDto) {
    await this.findOne(id);

    if (updateModelDto.isDefault) {
      await this.prisma.model.updateMany({
        where: { id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.model.update({
      where: { id },
      data: updateModelDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.model.delete({
      where: { id },
    });
    return { message: `Model "${id}" deleted successfully` };
  }

  async getDefaultModel() {
    return this.prisma.model.findFirst({
      where: { enabled: true, isDefault: true },
    });
  }
}
