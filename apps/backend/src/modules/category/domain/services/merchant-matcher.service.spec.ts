import { MerchantMatcherService } from './merchant-matcher.service';
import { Merchant } from '../entities/merchant.entity';
import type { IMerchantRepository } from '../repositories/merchant.repository.interface';
import { ClassificationConfidence } from '../value-objects/classification-confidence.vo';

describe('MerchantMatcherService', () => {
  let service: MerchantMatcherService;
  let mockRepository: jest.Mocked<IMerchantRepository>;

  beforeEach(() => {
    // リポジトリのモック作成
    mockRepository = {
      searchByDescription: jest.fn(),
    } as any; // Jest型定義の制約によりany使用

    service = new MerchantMatcherService(mockRepository);
  });

  describe('match', () => {
    it('店舗が見つかった場合、店舗を返す', async () => {
      const baseDate = new Date('2025-11-24T10:00:00Z');
      const merchant = new Merchant(
        'merchant-1',
        'スターバックス',
        ['STARBUCKS', 'スタバ'],
        'food_cafe',
        new ClassificationConfidence(0.95),
        baseDate,
        baseDate,
      );

      mockRepository.searchByDescription.mockResolvedValue(merchant);

      const result = await service.match('スターバックスコーヒー');

      expect(result).toBe(merchant);
      expect(mockRepository.searchByDescription).toHaveBeenCalledWith(
        'スターバックスコーヒー',
      );
      expect(mockRepository.searchByDescription).toHaveBeenCalledTimes(1);
    });

    it('店舗が見つからない場合、nullを返す', async () => {
      mockRepository.searchByDescription.mockResolvedValue(null);

      const result = await service.match('未知の店舗');

      expect(result).toBeNull();
      expect(mockRepository.searchByDescription).toHaveBeenCalledWith(
        '未知の店舗',
      );
    });

    it('リポジトリにPromiseを直接返す（awaitなし）', async () => {
      const baseDate = new Date('2025-11-24T10:00:00Z');
      const merchant = new Merchant(
        'merchant-1',
        'スターバックス',
        [],
        'food_cafe',
        new ClassificationConfidence(0.95),
        baseDate,
        baseDate,
      );

      mockRepository.searchByDescription.mockResolvedValue(merchant);

      // matchメソッドがPromiseを直接返すことを確認
      const result = service.match('スターバックス');
      expect(result).toBeInstanceOf(Promise);

      const resolvedResult = await result;
      expect(resolvedResult).toBe(merchant);
    });

    it('リポジトリエラーをそのまま伝播する', async () => {
      const error = new Error('Database connection failed');
      mockRepository.searchByDescription.mockRejectedValue(error);

      await expect(service.match('スターバックス')).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
