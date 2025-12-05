import { randomUUID } from 'crypto';
import { EventCategory } from '../enums/event-category.enum';

/**
 * Eventエンティティ
 * イベント情報を表すドメインエンティティ
 */
export class EventEntity {
  constructor(
    public readonly id: string,
    public readonly date: Date,
    public readonly title: string,
    public readonly description: string | null,
    public readonly category: EventCategory,
    public readonly tags: string[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    this.validate();
  }

  /**
   * バリデーション
   */
  private validate(): void {
    if (!this.id) {
      throw new Error('Event ID is required');
    }

    this.validateTitle(this.title);
    this.validateDate(this.date);

    if (this.description !== null && this.description.length > 1000) {
      throw new Error('Description must be 1000 characters or less');
    }

    if (!this.category) {
      throw new Error('Category is required');
    }

    if (!Array.isArray(this.tags)) {
      throw new Error('Tags must be an array');
    }

    if (!this.createdAt) {
      throw new Error('CreatedAt is required');
    }

    if (!this.updatedAt) {
      throw new Error('UpdatedAt is required');
    }
  }

  /**
   * タイトルのバリデーション（1-100文字）
   */
  validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Title is required');
    }

    if (title.length > 100) {
      throw new Error('Title must be 100 characters or less');
    }
  }

  /**
   * 日付のバリデーション
   */
  validateDate(date: Date): void {
    if (!date) {
      throw new Error('Date is required');
    }

    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('Date must be a valid Date object');
    }
  }

  /**
   * タグを追加
   */
  addTag(tag: string): EventEntity {
    if (!tag || tag.trim().length === 0) {
      throw new Error('Tag cannot be empty');
    }

    if (this.tags.includes(tag)) {
      return this; // 既に存在する場合は変更なし
    }

    return new EventEntity(
      this.id,
      this.date,
      this.title,
      this.description,
      this.category,
      [...this.tags, tag],
      this.createdAt,
      new Date(),
    );
  }

  /**
   * タグを削除
   */
  removeTag(tag: string): EventEntity {
    if (!this.tags.includes(tag)) {
      return this; // 存在しない場合は変更なし
    }

    return new EventEntity(
      this.id,
      this.date,
      this.title,
      this.description,
      this.category,
      this.tags.filter((t) => t !== tag),
      this.createdAt,
      new Date(),
    );
  }

  /**
   * イベントを更新
   */
  update(
    title?: string,
    date?: Date,
    description?: string | null,
    category?: EventCategory,
  ): EventEntity {
    const newTitle = title ?? this.title;
    const newDate = date ?? this.date;
    const newDescription = description ?? this.description;
    const newCategory = category ?? this.category;

    if (title !== undefined) {
      this.validateTitle(newTitle);
    }

    if (date !== undefined) {
      this.validateDate(newDate);
    }

    if (
      description !== undefined &&
      description !== null &&
      description.length > 1000
    ) {
      throw new Error('Description must be 1000 characters or less');
    }

    return new EventEntity(
      this.id,
      newDate,
      newTitle,
      newDescription,
      newCategory,
      this.tags,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 新しいイベントを作成（ファクトリメソッド）
   */
  static create(
    date: Date,
    title: string,
    description: string | null,
    category: EventCategory,
    tags: string[] = [],
  ): EventEntity {
    const now = new Date();
    return new EventEntity(
      randomUUID(),
      date,
      title,
      description,
      category,
      tags,
      now,
      now,
    );
  }
}
