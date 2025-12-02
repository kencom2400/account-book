import { Test, TestingModule } from '@nestjs/testing';
import { promises as fs } from 'fs';
import { NotificationRepository } from './notification.repository';
import { NotificationEntity } from '../../domain/entities/notification.entity';

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    access: jest.fn(),
  },
}));

describe('NotificationRepository', () => {
  let repository: NotificationRepository;

  const mockNotification = new NotificationEntity(
    'notif_1',
    'inst_1',
    'Test Bank',
    'Connection failed',
    'unread',
    new Date('2024-01-15'),
    new Date('2024-01-15'),
  );

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationRepository],
    }).compile();

    module.useLogger(false);

    repository = module.get<NotificationRepository>(NotificationRepository);
  });

  describe('save', () => {
    it('should save new notification', async () => {
      (fs.access as jest.Mock).mockRejectedValue(new Error('Not found'));
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('Not found'));
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

      const result = await repository.save(mockNotification);

      expect(result).toEqual(mockNotification);
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should update existing notification', async () => {
      const existingData = [
        {
          id: 'notif_1',
          institutionId: 'inst_1',
          institutionName: 'Test Bank',
          message: 'Old message',
          status: 'unread',
          createdAt: '2024-01-15T00:00:00.000Z',
          updatedAt: '2024-01-15T00:00:00.000Z',
        },
      ];

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify(existingData),
      );
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

      await repository.save(mockNotification);

      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should find notification by id', async () => {
      const mockData = [
        {
          id: 'notif_1',
          institutionId: 'inst_1',
          institutionName: 'Test Bank',
          message: 'Connection failed',
          status: 'unread',
          createdAt: '2024-01-15T00:00:00.000Z',
          updatedAt: '2024-01-15T00:00:00.000Z',
        },
      ];

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockData));
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

      const result = await repository.findById('notif_1');

      expect(result).toBeInstanceOf(NotificationEntity);
      expect(result?.id).toBe('notif_1');
    });

    it('should return null if not found', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify([]));
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all notifications', async () => {
      const mockData = [
        {
          id: 'notif_1',
          institutionId: 'inst_1',
          institutionName: 'Test Bank',
          message: 'Connection failed',
          status: 'unread',
          createdAt: '2024-01-15T00:00:00.000Z',
          updatedAt: '2024-01-15T00:00:00.000Z',
        },
      ];

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockData));
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(NotificationEntity);
    });

    it('should return empty array if file not exists', async () => {
      (fs.access as jest.Mock).mockRejectedValue(new Error('Not found'));
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });
});
