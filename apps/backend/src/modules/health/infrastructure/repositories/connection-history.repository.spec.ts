import { Test, TestingModule } from '@nestjs/testing';
import { promises as fs } from 'fs';
import { FileSystemConnectionHistoryRepository } from './connection-history.repository';
import { ConnectionHistory } from '../../domain/entities/connection-history.entity';
import { ConnectionStatus } from '../../domain/value-objects/connection-status.enum';

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    access: jest.fn(),
  },
}));

describe('FileSystemConnectionHistoryRepository', () => {
  let repository: FileSystemConnectionHistoryRepository;

  const mockHistory = new ConnectionHistory(
    'hist_1',
    'inst_1',
    'Test Bank',
    'bank',
    ConnectionStatus.SUCCESS,
    new Date('2024-01-15'),
    100,
  );

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [FileSystemConnectionHistoryRepository],
    }).compile();

    module.useLogger(false);

    repository = module.get<FileSystemConnectionHistoryRepository>(
      FileSystemConnectionHistoryRepository,
    );
  });

  describe('save', () => {
    it('should save connection history', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify({
          histories: [],
          lastUpdated: new Date().toISOString(),
        }),
      );
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

      await repository.save(mockHistory);

      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  describe('saveMany', () => {
    it('should save multiple histories', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify({
          histories: [],
          lastUpdated: new Date().toISOString(),
        }),
      );
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

      await repository.saveMany([mockHistory]);

      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  describe('findByInstitutionId', () => {
    it('should find latest history by institution id', async () => {
      const mockData = {
        histories: [
          {
            id: 'hist_1',
            institutionId: 'inst_1',
            institutionName: 'Test Bank',
            institutionType: 'bank',
            status: ConnectionStatus.SUCCESS,
            checkedAt: '2024-01-15T00:00:00.000Z',
            responseTime: 100,
          },
        ],
        lastUpdated: new Date().toISOString(),
      };

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

      const result = await repository.findByInstitutionIdAndDateRange(
        'inst_1',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(ConnectionHistory);
    });

    it('should return empty array if no histories found', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify({
          histories: [],
          lastUpdated: new Date().toISOString(),
        }),
      );

      const result = await repository.findByInstitutionIdAndDateRange(
        'nonexistent',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );

      expect(result).toEqual([]);
    });
  });

  describe('findLatestByInstitutionId', () => {
    it('should find latest history', async () => {
      const mockData = {
        histories: [
          {
            id: 'hist_1',
            institutionId: 'inst_1',
            institutionName: 'Test Bank',
            institutionType: 'bank',
            status: ConnectionStatus.SUCCESS,
            checkedAt: '2024-01-15T00:00:00.000Z',
            responseTime: 100,
          },
          {
            id: 'hist_2',
            institutionId: 'inst_1',
            institutionName: 'Test Bank',
            institutionType: 'bank',
            status: ConnectionStatus.SUCCESS,
            checkedAt: '2024-01-16T00:00:00.000Z',
            responseTime: 120,
          },
        ],
        lastUpdated: new Date().toISOString(),
      };

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

      const result = await repository.findLatestByInstitutionId('inst_1');

      expect(result).toBeInstanceOf(ConnectionHistory);
      expect(result?.id).toBe('hist_2');
    });

    it('should return null if no history found', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify({
          histories: [],
          lastUpdated: new Date().toISOString(),
        }),
      );

      const result = await repository.findLatestByInstitutionId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('deleteOlderThan', () => {
    it('should delete old histories', async () => {
      const mockData = {
        histories: [
          {
            id: 'hist_1',
            institutionId: 'inst_1',
            institutionName: 'Test Bank',
            institutionType: 'bank',
            status: ConnectionStatus.SUCCESS,
            checkedAt: '2023-01-15T00:00:00.000Z',
            responseTime: 100,
          },
          {
            id: 'hist_2',
            institutionId: 'inst_1',
            institutionName: 'Test Bank',
            institutionType: 'bank',
            status: ConnectionStatus.SUCCESS,
            checkedAt: '2024-01-15T00:00:00.000Z',
            responseTime: 100,
          },
        ],
        lastUpdated: new Date().toISOString(),
      };

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockData));
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

      const deletedCount = await repository.deleteOlderThan(
        new Date('2024-01-01'),
      );

      expect(deletedCount).toBe(1);
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });
});
