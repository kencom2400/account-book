import { startSync } from '../sync';
import { apiClient } from '../client';

// モック
jest.mock('../client');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('sync API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('startSync', () => {
    it('同期を開始する', async () => {
      const mockResponse = {
        success: true,
        data: [],
        summary: {
          totalInstitutions: 1,
          successCount: 1,
          failureCount: 0,
          totalFetched: 10,
          totalNew: 5,
          totalDuplicate: 5,
          duration: 1000,
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await startSync({
        institutionIds: ['inst-1'],
        forceFullSync: false,
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/sync/start', {
        institutionIds: ['inst-1'],
        forceFullSync: false,
      });
      expect(result).toEqual(mockResponse);
    });

    it('パラメータなしで呼び出せる', async () => {
      const mockResponse = {
        success: true,
        data: [],
        summary: {
          totalInstitutions: 0,
          successCount: 0,
          failureCount: 0,
          totalFetched: 0,
          totalNew: 0,
          totalDuplicate: 0,
          duration: 0,
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await startSync();

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/sync/start', {});
      expect(result).toEqual(mockResponse);
    });

    it('forceFullSyncをtrueで指定できる', async () => {
      const mockResponse = {
        success: true,
        data: [],
        summary: {
          totalInstitutions: 1,
          successCount: 1,
          failureCount: 0,
          totalFetched: 20,
          totalNew: 20,
          totalDuplicate: 0,
          duration: 2000,
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await startSync({
        institutionIds: ['inst-1', 'inst-2'],
        forceFullSync: true,
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/sync/start', {
        institutionIds: ['inst-1', 'inst-2'],
        forceFullSync: true,
      });
      expect(result).toEqual(mockResponse);
    });

    it('エラー時に例外をスローする', async () => {
      const error = new Error('API Error');
      mockApiClient.post.mockRejectedValue(error);

      await expect(
        startSync({
          institutionIds: ['inst-1'],
        })
      ).rejects.toThrow('API Error');
    });
  });
});
