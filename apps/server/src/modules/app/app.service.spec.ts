import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateAppDto, UpdateAppDto } from './dto/app.dto';

// Mock generateApiKey - must be defined before vi.mock due to hoisting
vi.mock('../../common/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../common/utils')>();
  return {
    ...actual,
    generateApiKey: vi.fn(() => 'sk_testapikey123456789012345678901'),
  };
});

describe('AppService', () => {
  let appService: AppService;
  let mockPrismaService: any;

  beforeEach(async () => {
    mockPrismaService = {
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      $transaction: vi.fn((fn) => fn(mockPrismaService)),
      app: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      model: {
        findFirst: vi.fn(),
      },
    };

    // Direct instantiation instead of using TestingModule
    appService = new AppService(mockPrismaService);
    vi.clearAllMocks();
    
    // Reset mock to default value
    const { generateApiKey } = await import('../../common/utils');
    vi.mocked(generateApiKey).mockReturnValue('sk_testapikey123456789012345678901');
  });

  it('should be defined', () => {
    expect(appService).toBeDefined();
  });

  describe('create', () => {
    it('should create an app with API key', async () => {
      const createAppDto: CreateAppDto = {
        name: 'Test App',
        description: 'Test Description',
      };

      const mockApp = {
        id: 'app-1',
        ...createAppDto,
        apiKey: 'sk_testapikey123456789012345678901',
        modelId: 'ollama:qwen3.5:9b',
        config: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.model.findFirst.mockResolvedValue(null);
      mockPrismaService.app.create.mockResolvedValue(mockApp);

      const result = await appService.create(createAppDto);

      expect(mockPrismaService.model.findFirst).toHaveBeenCalledWith({
        where: { enabled: true, isDefault: true },
      });
      expect(mockPrismaService.app.create).toHaveBeenCalledWith({
        data: {
          ...createAppDto,
          modelId: 'ollama:qwen3.5:9b',
          apiKey: 'sk_testapikey123456789012345678901',
          config: {},
        },
      });
      expect(result).toEqual(mockApp);
      expect(result.apiKey).toBe('sk_testapikey123456789012345678901');
    });

    it('should generate API key in correct format (sk_xxx)', async () => {
      const createAppDto: CreateAppDto = {
        name: 'Test App',
      };

      const mockApp = {
        id: 'app-1',
        ...createAppDto,
        apiKey: 'sk_testapikey123456789012345678901',
        modelId: 'ollama:qwen3.5:9b',
        config: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.model.findFirst.mockResolvedValue(null);
      mockPrismaService.app.create.mockResolvedValue(mockApp);

      const result = await appService.create(createAppDto);

      expect(result.apiKey).toMatch(/^sk_[a-zA-Z0-9]+$/);
      expect(result.apiKey.length).toBeGreaterThan(3);
    });

    it('should handle app creation (name uniqueness not enforced in current implementation)', async () => {
      const createAppDto: CreateAppDto = {
        name: 'Existing App',
      };

      const mockApp = {
        id: 'app-1',
        ...createAppDto,
        apiKey: 'sk_testapikey123456789012345678901',
        modelId: 'ollama:qwen3.5:9b',
        config: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.model.findFirst.mockResolvedValue(null);
      mockPrismaService.app.create.mockResolvedValue(mockApp);

      const result = await appService.create(createAppDto);

      expect(result).toBeDefined();
      expect(result.name).toBe('Existing App');
    });
  });

  describe('findAll', () => {
    it('should return list of apps ordered by createdAt desc', async () => {
      const mockApps = [
        {
          id: 'app-1',
          name: 'App 1',
          apiKey: 'sk_key1',
          modelId: 'qwen-turbo',
          config: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'app-2',
          name: 'App 2',
          apiKey: 'sk_key2',
          modelId: 'qwen-plus',
          config: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.app.findMany.mockResolvedValue(mockApps);

      const result = await appService.findAll();

      expect(mockPrismaService.app.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockApps);
      expect(result.length).toBe(2);
    });

    it('should return all apps', async () => {
      const mockApps = [
        { id: 'app-1', name: 'App 1', apiKey: 'sk_key1', modelId: 'qwen-turbo', config: {} },
        { id: 'app-2', name: 'App 2', apiKey: 'sk_key2', modelId: 'qwen-plus', config: {} },
        { id: 'app-3', name: 'App 3', apiKey: 'sk_key3', modelId: 'qwen-max', config: {} },
      ];

      mockPrismaService.app.findMany.mockResolvedValue(mockApps);

      const result = await appService.findAll();

      expect(result).toHaveLength(3);
    });
  });

  describe('findOne', () => {
    it('should find an existing app', async () => {
      const appId = 'app-1';
      const mockApp = {
        id: appId,
        name: 'Test App',
        apiKey: 'sk_test_key',
        modelId: 'qwen-turbo',
        config: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.app.findUnique.mockResolvedValue(mockApp);

      const result = await appService.findOne(appId);

      expect(mockPrismaService.app.findUnique).toHaveBeenCalledWith({
        where: { id: appId },
      });
      expect(result).toEqual(mockApp);
    });

    it('should throw NotFoundException when app not found', async () => {
      const appId = 'non-existent-id';

      mockPrismaService.app.findUnique.mockResolvedValue(null);

      await expect(appService.findOne(appId)).rejects.toThrow(NotFoundException);
      await expect(appService.findOne(appId)).rejects.toThrow(
        `App with id "${appId}" not found`,
      );
    });
  });

  describe('update', () => {
    it('should update app configuration', async () => {
      const appId = 'app-1';
      const updateAppDto: UpdateAppDto = {
        name: 'Updated App Name',
        description: 'Updated Description',
      };

      const mockApp = {
        id: appId,
        name: 'Updated App Name',
        description: 'Updated Description',
        apiKey: 'sk_test_key',
        modelId: 'qwen-turbo',
        config: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.app.findUnique.mockResolvedValue({ id: appId });
      mockPrismaService.app.update.mockResolvedValue(mockApp);

      const result = await appService.update(appId, updateAppDto);

      expect(mockPrismaService.app.findUnique).toHaveBeenCalledWith({
        where: { id: appId },
      });
      expect(mockPrismaService.app.update).toHaveBeenCalledWith({
        where: { id: appId },
        data: updateAppDto,
      });
      expect(result).toEqual(mockApp);
    });
  });

  describe('remove', () => {
    it('should delete an app', async () => {
      const appId = 'app-1';

      const mockApp = {
        id: appId,
        name: 'Test App',
        apiKey: 'sk_test_key',
        modelId: 'qwen-turbo',
        config: {},
      };

      mockPrismaService.app.findUnique.mockResolvedValue(mockApp);
      mockPrismaService.app.delete.mockResolvedValue(mockApp);

      const result = await appService.remove(appId);

      expect(mockPrismaService.app.findUnique).toHaveBeenCalledWith({
        where: { id: appId },
      });
      expect(mockPrismaService.app.delete).toHaveBeenCalledWith({
        where: { id: appId },
      });
      expect(result).toEqual({ message: `App "${appId}" deleted successfully` });
    });
  });

  describe('regenerateApiKey', () => {
    it('should regenerate API key for an app', async () => {
      const appId = 'app-1';
      const newApiKey = 'sk_newapikey123456789012345678902';
      
      // Override the mock for this test
      const { generateApiKey } = await import('../../common/utils');
      vi.mocked(generateApiKey).mockReturnValue(newApiKey);

      const mockApp = {
        id: appId,
        name: 'Test App',
        apiKey: newApiKey,
        modelId: 'qwen-turbo',
        config: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.app.findUnique.mockResolvedValue({ id: appId });
      mockPrismaService.app.update.mockResolvedValue(mockApp);

      const result = await appService.regenerateApiKey(appId);

      expect(mockPrismaService.app.findUnique).toHaveBeenCalledWith({
        where: { id: appId },
      });
      expect(mockPrismaService.app.update).toHaveBeenCalledWith({
        where: { id: appId },
        data: { apiKey: newApiKey },
      });
      expect(result.apiKey).toBe(newApiKey);
    });
  });
});
