import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { ModelService } from './model.service';
import { CreateModelDto, UpdateModelDto } from './dto/model.dto';

describe('ModelService', () => {
  let modelService: ModelService;
  let mockPrismaService: any;

  beforeEach(() => {
    mockPrismaService = {
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      $transaction: vi.fn((fn) => fn(mockPrismaService)),
      model: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
      },
    };

    // Direct instantiation instead of using TestingModule
    modelService = new ModelService(mockPrismaService);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(modelService).toBeDefined();
  });

  describe('create', () => {
    it('should create a model configuration', async () => {
      const createModelDto: CreateModelDto = {
        name: 'Test Model',
        provider: 'aliyun',
        model: 'qwen-turbo',
        config: { apiKey: 'sk-test-key' },
        enabled: true,
        isDefault: false,
      };

      const mockModel = {
        id: 'model-1',
        ...createModelDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.model.create.mockResolvedValue(mockModel);

      const result = await modelService.create(createModelDto);

      expect(mockPrismaService.model.create).toHaveBeenCalledWith({
        data: createModelDto,
      });
      expect(result).toEqual(mockModel);
    });

    it('should set default model (unset other defaults)', async () => {
      const createModelDto: CreateModelDto = {
        name: 'Default Model',
        provider: 'ollama',
        model: 'qwen3.5:9b',
        enabled: true,
        isDefault: true,
      };

      const mockModel = {
        id: 'model-1',
        ...createModelDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.model.updateMany.mockResolvedValue(undefined);
      mockPrismaService.model.create.mockResolvedValue(mockModel);

      const result = await modelService.create(createModelDto);

      expect(mockPrismaService.model.updateMany).toHaveBeenCalledWith({
        where: {},
        data: { isDefault: false },
      });
      expect(mockPrismaService.model.create).toHaveBeenCalledWith({
        data: createModelDto,
      });
      expect(result.isDefault).toBe(true);
    });
  });

  describe('findAll', () => {
    it('should return all models ordered by createdAt desc', async () => {
      const mockModels = [
        {
          id: 'model-1',
          name: 'Qwen Turbo',
          provider: 'aliyun',
          model: 'qwen-turbo',
          enabled: true,
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'model-2',
          name: 'Qwen Plus',
          provider: 'aliyun',
          model: 'qwen-plus',
          enabled: true,
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'model-3',
          name: 'Ollama Qwen',
          provider: 'ollama',
          model: 'qwen3.5:9b',
          enabled: true,
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.model.findMany.mockResolvedValue(mockModels);

      const result = await modelService.findAll();

      expect(mockPrismaService.model.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockModels);
      expect(result.length).toBe(3);
    });
  });

  describe('findOne', () => {
    it('should find an existing model', async () => {
      const modelId = 'model-1';
      const mockModel = {
        id: modelId,
        name: 'Test Model',
        provider: 'aliyun',
        model: 'qwen-turbo',
        enabled: true,
        isDefault: true,
        config: { apiKey: 'sk-test-key' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.model.findUnique.mockResolvedValue(mockModel);

      const result = await modelService.findOne(modelId);

      expect(mockPrismaService.model.findUnique).toHaveBeenCalledWith({
        where: { id: modelId },
      });
      expect(result).toEqual(mockModel);
    });

    it('should throw NotFoundException when model not found', async () => {
      const modelId = 'non-existent-id';

      mockPrismaService.model.findUnique.mockResolvedValue(null);

      await expect(modelService.findOne(modelId)).rejects.toThrow(NotFoundException);
      await expect(modelService.findOne(modelId)).rejects.toThrow(
        `Model with id "${modelId}" not found`,
      );
    });
  });

  describe('getDefaultModel', () => {
    it('should return the default model', async () => {
      const mockDefaultModel = {
        id: 'model-1',
        name: 'Default Model',
        provider: 'ollama',
        model: 'qwen3.5:9b',
        enabled: true,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.model.findFirst.mockResolvedValue(mockDefaultModel);

      const result = await modelService.getDefaultModel();

      expect(mockPrismaService.model.findFirst).toHaveBeenCalledWith({
        where: { enabled: true, isDefault: true },
      });
      expect(result).toEqual(mockDefaultModel);
    });

    it('should return null when no default model exists', async () => {
      mockPrismaService.model.findFirst.mockResolvedValue(null);

      const result = await modelService.getDefaultModel();

      expect(mockPrismaService.model.findFirst).toHaveBeenCalledWith({
        where: { enabled: true, isDefault: true },
      });
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update model configuration', async () => {
      const modelId = 'model-1';
      const updateModelDto: UpdateModelDto = {
        name: 'Updated Model Name',
        enabled: false,
      };

      const mockModel = {
        id: modelId,
        name: 'Updated Model Name',
        provider: 'aliyun',
        model: 'qwen-turbo',
        enabled: false,
        isDefault: false,
        config: { apiKey: 'sk-test-key' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.model.findUnique.mockResolvedValue({ id: modelId });
      mockPrismaService.model.update.mockResolvedValue(mockModel);

      const result = await modelService.update(modelId, updateModelDto);

      expect(mockPrismaService.model.findUnique).toHaveBeenCalledWith({
        where: { id: modelId },
      });
      expect(mockPrismaService.model.update).toHaveBeenCalledWith({
        where: { id: modelId },
        data: updateModelDto,
      });
      expect(result).toEqual(mockModel);
    });

    it('should unset other defaults when setting a new default model', async () => {
      const modelId = 'model-1';
      const updateModelDto: UpdateModelDto = {
        name: 'New Default Model',
        isDefault: true,
      };

      const mockModel = {
        id: modelId,
        name: 'New Default Model',
        provider: 'ollama',
        model: 'qwen3.5:9b',
        enabled: true,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.model.findUnique.mockResolvedValue({ id: modelId });
      mockPrismaService.model.updateMany.mockResolvedValue(undefined);
      mockPrismaService.model.update.mockResolvedValue(mockModel);

      const result = await modelService.update(modelId, updateModelDto);

      expect(mockPrismaService.model.updateMany).toHaveBeenCalledWith({
        where: { id: { not: modelId } },
        data: { isDefault: false },
      });
      expect(mockPrismaService.model.update).toHaveBeenCalledWith({
        where: { id: modelId },
        data: updateModelDto,
      });
      expect(result.isDefault).toBe(true);
    });
  });

  describe('remove', () => {
    it('should delete a model', async () => {
      const modelId = 'model-1';

      const mockModel = {
        id: modelId,
        name: 'Test Model',
        provider: 'aliyun',
        model: 'qwen-turbo',
        enabled: true,
        isDefault: false,
      };

      mockPrismaService.model.findUnique.mockResolvedValue(mockModel);
      mockPrismaService.model.delete.mockResolvedValue(mockModel);

      const result = await modelService.remove(modelId);

      expect(mockPrismaService.model.findUnique).toHaveBeenCalledWith({
        where: { id: modelId },
      });
      expect(mockPrismaService.model.delete).toHaveBeenCalledWith({
        where: { id: modelId },
      });
      expect(result).toEqual({ message: `Model "${modelId}" deleted successfully` });
    });
  });
});
