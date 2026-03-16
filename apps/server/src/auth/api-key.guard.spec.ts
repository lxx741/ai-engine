import { ApiKeyGuard } from './api-key.guard';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let mockReflector: Partial<Reflector>;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: vi.fn(),
    };
    mockConfigService = {
      get: vi.fn(),
    };

    guard = new ApiKeyGuard(
      mockReflector as Reflector,
      mockConfigService as ConfigService,
    );
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for valid API Key (Bearer format)', () => {
      const mockContext = {
        getHandler: vi.fn(),
        getMethod: vi.fn(),
        getClass: vi.fn(),
        switchToHttp: vi.fn().mockReturnValue({
          getRequest: vi.fn().mockReturnValue({
            headers: {
              authorization: 'Bearer valid-api-key-123',
            },
          }),
        }),
      } as any;

      vi.spyOn(mockReflector, 'getAllAndOverride').mockReturnValue(false);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should return false for invalid API Key', () => {
      const mockContext = {
        getHandler: vi.fn(),
        getMethod: vi.fn(),
        getClass: vi.fn(),
        switchToHttp: vi.fn().mockReturnValue({
          getRequest: vi.fn().mockReturnValue({
            headers: {
              'x-api-key': '',
            },
          }),
        }),
      } as any;

      vi.spyOn(mockReflector, 'getAllAndOverride').mockReturnValue(false);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it('should return false when API Key is missing', () => {
      const mockContext = {
        getHandler: vi.fn(),
        getMethod: vi.fn(),
        getClass: vi.fn(),
        switchToHttp: vi.fn().mockReturnValue({
          getRequest: vi.fn().mockReturnValue({
            headers: {},
          }),
        }),
      } as any;

      vi.spyOn(mockReflector, 'getAllAndOverride').mockReturnValue(false);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it('should return true for non-Bearer format (accepts any non-empty key)', () => {
      const mockContext = {
        getHandler: vi.fn(),
        getMethod: vi.fn(),
        getClass: vi.fn(),
        switchToHttp: vi.fn().mockReturnValue({
          getRequest: vi.fn().mockReturnValue({
            headers: {
              authorization: 'Basic some-credentials',
            },
          }),
        }),
      } as any;

      vi.spyOn(mockReflector, 'getAllAndOverride').mockReturnValue(false);

      const result = guard.canActivate(mockContext);

      // Non-Bearer format: the whole string "Basic some-credentials" is used as key
      // Since it's non-empty, the guard returns true (current implementation)
      expect(result).toBe(true);
    });
  });
});
