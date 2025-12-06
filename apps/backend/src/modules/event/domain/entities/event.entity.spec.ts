import { EventEntity } from './event.entity';
import { EventCategory } from '../enums/event-category.enum';

describe('EventEntity', () => {
  const validEventData = {
    id: 'evt_123',
    date: new Date('2025-04-01'),
    title: '入学式',
    description: '長男の小学校入学式',
    category: EventCategory.EDUCATION,
    tags: ['学校', '入学'],
    createdAt: new Date('2025-01-27T10:00:00'),
    updatedAt: new Date('2025-01-27T10:00:00'),
  };

  describe('constructor', () => {
    it('should create a valid event entity', () => {
      const event = new EventEntity(
        validEventData.id,
        validEventData.date,
        validEventData.title,
        validEventData.description,
        validEventData.category,
        validEventData.tags,
        validEventData.createdAt,
        validEventData.updatedAt,
      );

      expect(event.id).toBe('evt_123');
      expect(event.title).toBe('入学式');
      expect(event.category).toBe(EventCategory.EDUCATION);
      expect(event.tags).toEqual(['学校', '入学']);
    });

    it('should throw error when id is missing', () => {
      expect(
        () =>
          new EventEntity(
            '',
            validEventData.date,
            validEventData.title,
            validEventData.description,
            validEventData.category,
            validEventData.tags,
            validEventData.createdAt,
            validEventData.updatedAt,
          ),
      ).toThrow('Event ID is required');
    });

    it('should throw error when title is empty', () => {
      expect(
        () =>
          new EventEntity(
            validEventData.id,
            validEventData.date,
            '',
            validEventData.description,
            validEventData.category,
            validEventData.tags,
            validEventData.createdAt,
            validEventData.updatedAt,
          ),
      ).toThrow('Title is required');
    });

    it('should throw error when title exceeds 100 characters', () => {
      const longTitle = 'a'.repeat(101);
      expect(
        () =>
          new EventEntity(
            validEventData.id,
            validEventData.date,
            longTitle,
            validEventData.description,
            validEventData.category,
            validEventData.tags,
            validEventData.createdAt,
            validEventData.updatedAt,
          ),
      ).toThrow('Title must be 100 characters or less');
    });

    it('should throw error when date is invalid', () => {
      expect(
        () =>
          new EventEntity(
            validEventData.id,
            new Date('invalid') as any,
            validEventData.title,
            validEventData.description,
            validEventData.category,
            validEventData.tags,
            validEventData.createdAt,
            validEventData.updatedAt,
          ),
      ).toThrow('Date must be a valid Date object');
    });

    it('should throw error when description exceeds 1000 characters', () => {
      const longDescription = 'a'.repeat(1001);
      expect(
        () =>
          new EventEntity(
            validEventData.id,
            validEventData.date,
            validEventData.title,
            longDescription,
            validEventData.category,
            validEventData.tags,
            validEventData.createdAt,
            validEventData.updatedAt,
          ),
      ).toThrow('Description must be 1000 characters or less');
    });

    it('should accept null description', () => {
      const event = new EventEntity(
        validEventData.id,
        validEventData.date,
        validEventData.title,
        null,
        validEventData.category,
        validEventData.tags,
        validEventData.createdAt,
        validEventData.updatedAt,
      );

      expect(event.description).toBeNull();
    });

    it('should throw error when category is missing', () => {
      expect(
        () =>
          new EventEntity(
            validEventData.id,
            validEventData.date,
            validEventData.title,
            validEventData.description,
            undefined as any,
            validEventData.tags,
            validEventData.createdAt,
            validEventData.updatedAt,
          ),
      ).toThrow('Category is required');
    });

    it('should throw error when tags is not an array', () => {
      expect(
        () =>
          new EventEntity(
            validEventData.id,
            validEventData.date,
            validEventData.title,
            validEventData.description,
            validEventData.category,
            'not-array' as any,
            validEventData.createdAt,
            validEventData.updatedAt,
          ),
      ).toThrow('Tags must be an array');
    });

    it('should throw error when createdAt is missing', () => {
      expect(
        () =>
          new EventEntity(
            validEventData.id,
            validEventData.date,
            validEventData.title,
            validEventData.description,
            validEventData.category,
            validEventData.tags,
            null as any,
            validEventData.updatedAt,
          ),
      ).toThrow('CreatedAt is required');
    });

    it('should throw error when updatedAt is missing', () => {
      expect(
        () =>
          new EventEntity(
            validEventData.id,
            validEventData.date,
            validEventData.title,
            validEventData.description,
            validEventData.category,
            validEventData.tags,
            validEventData.createdAt,
            null as any,
          ),
      ).toThrow('UpdatedAt is required');
    });

    it('should throw error when date is null', () => {
      expect(
        () =>
          new EventEntity(
            validEventData.id,
            null as any,
            validEventData.title,
            validEventData.description,
            validEventData.category,
            validEventData.tags,
            validEventData.createdAt,
            validEventData.updatedAt,
          ),
      ).toThrow('Date is required');
    });
  });

  describe('addTag', () => {
    it('should add a new tag', () => {
      const event = new EventEntity(
        validEventData.id,
        validEventData.date,
        validEventData.title,
        validEventData.description,
        validEventData.category,
        [],
        validEventData.createdAt,
        validEventData.updatedAt,
      );

      const updatedEvent = event.addTag('新タグ');

      expect(updatedEvent.tags).toContain('新タグ');
      expect(updatedEvent.tags.length).toBe(1);
      expect(updatedEvent.updatedAt.getTime()).toBeGreaterThan(
        event.updatedAt.getTime(),
      );
    });

    it('should not add duplicate tag', () => {
      const event = new EventEntity(
        validEventData.id,
        validEventData.date,
        validEventData.title,
        validEventData.description,
        validEventData.category,
        ['既存タグ'],
        validEventData.createdAt,
        validEventData.updatedAt,
      );

      const updatedEvent = event.addTag('既存タグ');

      expect(updatedEvent.tags).toEqual(['既存タグ']);
      expect(updatedEvent.tags.length).toBe(1);
    });

    it('should throw error when tag is empty', () => {
      const event = new EventEntity(
        validEventData.id,
        validEventData.date,
        validEventData.title,
        validEventData.description,
        validEventData.category,
        [],
        validEventData.createdAt,
        validEventData.updatedAt,
      );

      expect(() => event.addTag('')).toThrow('Tag cannot be empty');
      expect(() => event.addTag('   ')).toThrow('Tag cannot be empty');
    });
  });

  describe('removeTag', () => {
    it('should remove an existing tag', () => {
      const event = new EventEntity(
        validEventData.id,
        validEventData.date,
        validEventData.title,
        validEventData.description,
        validEventData.category,
        ['タグ1', 'タグ2'],
        validEventData.createdAt,
        validEventData.updatedAt,
      );

      const updatedEvent = event.removeTag('タグ1');

      expect(updatedEvent.tags).not.toContain('タグ1');
      expect(updatedEvent.tags).toContain('タグ2');
      expect(updatedEvent.tags.length).toBe(1);
      expect(updatedEvent.updatedAt.getTime()).toBeGreaterThan(
        event.updatedAt.getTime(),
      );
    });

    it('should not remove non-existent tag', () => {
      const event = new EventEntity(
        validEventData.id,
        validEventData.date,
        validEventData.title,
        validEventData.description,
        validEventData.category,
        ['タグ1'],
        validEventData.createdAt,
        validEventData.updatedAt,
      );

      const updatedEvent = event.removeTag('存在しないタグ');

      expect(updatedEvent.tags).toEqual(['タグ1']);
      expect(updatedEvent.tags.length).toBe(1);
    });
  });

  describe('update', () => {
    it('should update title', () => {
      const event = new EventEntity(
        validEventData.id,
        validEventData.date,
        validEventData.title,
        validEventData.description,
        validEventData.category,
        validEventData.tags,
        validEventData.createdAt,
        validEventData.updatedAt,
      );

      const updatedEvent = event.update('新しいタイトル');

      expect(updatedEvent.title).toBe('新しいタイトル');
      expect(updatedEvent.updatedAt.getTime()).toBeGreaterThan(
        event.updatedAt.getTime(),
      );
    });

    it('should update date', () => {
      const event = new EventEntity(
        validEventData.id,
        validEventData.date,
        validEventData.title,
        validEventData.description,
        validEventData.category,
        validEventData.tags,
        validEventData.createdAt,
        validEventData.updatedAt,
      );

      const newDate = new Date('2025-05-01');
      const updatedEvent = event.update(undefined, newDate);

      expect(updatedEvent.date).toEqual(newDate);
      expect(updatedEvent.updatedAt.getTime()).toBeGreaterThan(
        event.updatedAt.getTime(),
      );
    });

    it('should update description', () => {
      const event = new EventEntity(
        validEventData.id,
        validEventData.date,
        validEventData.title,
        validEventData.description,
        validEventData.category,
        validEventData.tags,
        validEventData.createdAt,
        validEventData.updatedAt,
      );

      const updatedEvent = event.update(undefined, undefined, '新しい説明');

      expect(updatedEvent.description).toBe('新しい説明');
      expect(updatedEvent.updatedAt.getTime()).toBeGreaterThan(
        event.updatedAt.getTime(),
      );
    });

    it('should update category', () => {
      const event = new EventEntity(
        validEventData.id,
        validEventData.date,
        validEventData.title,
        validEventData.description,
        validEventData.category,
        validEventData.tags,
        validEventData.createdAt,
        validEventData.updatedAt,
      );

      const updatedEvent = event.update(
        undefined,
        undefined,
        undefined,
        EventCategory.TRAVEL,
      );

      expect(updatedEvent.category).toBe(EventCategory.TRAVEL);
      expect(updatedEvent.updatedAt.getTime()).toBeGreaterThan(
        event.updatedAt.getTime(),
      );
    });

    it('should update multiple fields', () => {
      const event = new EventEntity(
        validEventData.id,
        validEventData.date,
        validEventData.title,
        validEventData.description,
        validEventData.category,
        validEventData.tags,
        validEventData.createdAt,
        validEventData.updatedAt,
      );

      const newDate = new Date('2025-05-01');
      const updatedEvent = event.update(
        '新しいタイトル',
        newDate,
        '新しい説明',
        EventCategory.TRAVEL,
      );

      expect(updatedEvent.title).toBe('新しいタイトル');
      expect(updatedEvent.date).toEqual(newDate);
      expect(updatedEvent.description).toBe('新しい説明');
      expect(updatedEvent.category).toBe(EventCategory.TRAVEL);
    });

    it('should throw error when updated title is invalid', () => {
      const event = new EventEntity(
        validEventData.id,
        validEventData.date,
        validEventData.title,
        validEventData.description,
        validEventData.category,
        validEventData.tags,
        validEventData.createdAt,
        validEventData.updatedAt,
      );

      expect(() => event.update('')).toThrow('Title is required');
      expect(() => event.update('a'.repeat(101))).toThrow(
        'Title must be 100 characters or less',
      );
    });

    it('should throw error when updated description exceeds 1000 characters', () => {
      const event = new EventEntity(
        validEventData.id,
        validEventData.date,
        validEventData.title,
        validEventData.description,
        validEventData.category,
        validEventData.tags,
        validEventData.createdAt,
        validEventData.updatedAt,
      );

      const longDescription = 'a'.repeat(1001);
      expect(() => event.update(undefined, undefined, longDescription)).toThrow(
        'Description must be 1000 characters or less',
      );
    });
  });

  describe('create', () => {
    it('should create a new event with factory method', () => {
      const date = new Date('2025-04-01');
      const event = EventEntity.create(
        date,
        '入学式',
        '長男の小学校入学式',
        EventCategory.EDUCATION,
        ['学校', '入学'],
      );

      expect(event.id).toBeDefined();
      expect(event.title).toBe('入学式');
      expect(event.date).toEqual(date);
      expect(event.category).toBe(EventCategory.EDUCATION);
      expect(event.tags).toEqual(['学校', '入学']);
      expect(event.createdAt).toBeInstanceOf(Date);
      expect(event.updatedAt).toBeInstanceOf(Date);
    });

    it('should create event with empty tags array', () => {
      const date = new Date('2025-04-01');
      const event = EventEntity.create(
        date,
        '入学式',
        null,
        EventCategory.EDUCATION,
      );

      expect(event.tags).toEqual([]);
      expect(event.description).toBeNull();
    });
  });
});
