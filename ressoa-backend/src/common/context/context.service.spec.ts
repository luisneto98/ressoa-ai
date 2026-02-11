import { Test, TestingModule } from '@nestjs/testing';
import { ContextService } from './context.service';

describe('ContextService', () => {
  let service: ContextService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContextService],
    }).compile();

    service = module.get<ContextService>(ContextService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('run()', () => {
    it('should execute callback with tenant context', async () => {
      const escolaId = 'escola-123';
      const callback = jest.fn(async () => 'result');

      const result = await service.run(escolaId, callback);

      expect(callback).toHaveBeenCalled();
      expect(result).toBe('result');
    });

    it('should allow getEscolaId() to retrieve context inside callback', async () => {
      const escolaId = 'escola-456';
      let retrievedId: string | undefined;

      await service.run(escolaId, async () => {
        retrievedId = service.getEscolaId();
      });

      expect(retrievedId).toBe(escolaId);
    });

    it('should handle errors thrown in callback', async () => {
      const escolaId = 'escola-789';
      const error = new Error('Test error');
      const callback = jest.fn(async () => {
        throw error;
      });

      await expect(service.run(escolaId, callback)).rejects.toThrow('Test error');
    });

    it('should isolate context between concurrent calls', async () => {
      const escola1Id = 'escola-1';
      const escola2Id = 'escola-2';

      const results = await Promise.all([
        service.run(escola1Id, async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return service.getEscolaId();
        }),
        service.run(escola2Id, async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return service.getEscolaId();
        }),
      ]);

      expect(results[0]).toBe(escola1Id);
      expect(results[1]).toBe(escola2Id);
    });
  });

  describe('getEscolaId()', () => {
    it('should return undefined when no context is set', () => {
      const escolaId = service.getEscolaId();
      expect(escolaId).toBeUndefined();
    });

    it('should return escolaId inside run() context', async () => {
      const escolaId = 'escola-test';

      await service.run(escolaId, async () => {
        expect(service.getEscolaId()).toBe(escolaId);
      });
    });

    it('should return undefined after run() context ends', async () => {
      const escolaId = 'escola-test';

      await service.run(escolaId, async () => {
        expect(service.getEscolaId()).toBe(escolaId);
      });

      expect(service.getEscolaId()).toBeUndefined();
    });
  });

  describe('getEscolaIdOrThrow()', () => {
    it('should return escolaId when context exists', async () => {
      const escolaId = 'escola-valid';

      await service.run(escolaId, async () => {
        expect(service.getEscolaIdOrThrow()).toBe(escolaId);
      });
    });

    it('should throw error when no context exists', () => {
      expect(() => service.getEscolaIdOrThrow()).toThrow(
        'Tenant context not available',
      );
    });
  });

  describe('Nested contexts', () => {
    it('should support nested run() calls', async () => {
      const escolaId1 = 'escola-outer';
      const escolaId2 = 'escola-inner';

      await service.run(escolaId1, async () => {
        expect(service.getEscolaId()).toBe(escolaId1);

        await service.run(escolaId2, async () => {
          // Inner context should override outer
          expect(service.getEscolaId()).toBe(escolaId2);
        });

        // Outer context should be restored
        expect(service.getEscolaId()).toBe(escolaId1);
      });
    });
  });
});
