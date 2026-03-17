import { describe, it, expect, beforeEach } from 'vitest';
import { ModelService } from '../../src/modules/model/model.service';
import { PrismaService } from '../../src/prisma/prisma.service';

// Mock PrismaService
const mockPrismaService = {
  model: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updateMany: vi.fn(),
  },
};

describe('Models API E2E', () => {
  let modelService: ModelService;

  beforeEach(() => {
    vi.clearAllMocks();
    modelService = new ModelService(mockPrismaService as any);
  });

  describe('GET /api/models', () => {
    it('should get list of models (public endpoint, no auth required)', async () => {
      const mockModels = [
        { id: '1', name: '通义千问', provider: 'aliyun', model: 'qwen-turbo', enabled: true, isDefault: true },
        { id: '2', name: 'Ollama Local', provider: 'ollama', model: 'llama2', enabled: true, isDefault: false },
      ];
      mockPrismaService.model.findMany.mockResolvedValue(mockModels);

      const result = await modelService.findAll();

      expect(result).toEqual(mockModels);
      expect(mockPrismaService.model.findMany).toHaveBeenCalled();
    });

    it('should return models with required fields (id, name, provider)', async () => {
      const mockModels = [
        { id: '1', name: '通义千问', provider: 'aliyun', model: 'qwen-turbo', enabled: true, isDefault: true },
        { id: '2', name: 'Ollama Local', provider: 'ollama', model: 'llama2', enabled: true, isDefault: false },
      ];
      mockPrismaService.model.findMany.mockResolvedValue(mockModels);

      const result = await modelService.findAll();

      expect(result).toHaveLength(2);
      result.forEach((model: any) => {
        expect(model).toHaveProperty('id');
        expect(model).toHaveProperty('name');
        expect(model).toHaveProperty('provider');
      });
    });

    it('should return model list without authentication', async () => {
      const mockModels = [
        { id: '1', name: '通义千问', provider: 'aliyun', model: 'qwen-turbo', enabled: true },
      ];
      mockPrismaService.model.findMany.mockResolvedValue(mockModels);

      const result = await modelService.findAll();

      expect(result).toEqual(mockModels);
    });
  });

  describe('GET /api/models/:id', () => {
    it('should get model details by id', async () => {
      const mockModel = { id: '1', name: '通义千问', provider: 'aliyun', model: 'qwen-turbo', enabled: true, isDefault: true };
      mockPrismaService.model.findUnique.mockResolvedValue(mockModel);

      const result = await modelService.findOne('1');

      expect(result).toEqual(mockModel);
      expect(mockPrismaService.model.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should return 404 for non-existent model', async () => {
      mockPrismaService.model.findUnique.mockResolvedValue(null);

      await expect(modelService.findOne('non-existent-id')).rejects.toThrow('Model with id "non-existent-id" not found');
    });
  });
});
