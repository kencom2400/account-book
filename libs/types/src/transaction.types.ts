import { CategoryType } from './enums/category-type.enum';
import { ClassificationReason } from './subcategory.types';

export interface Transaction {
  id: string;
  date: Date;
  amount: number;
  category: Category;
  description: string;
  institutionId: string;
  accountId: string;
  status: TransactionStatus;
  isReconciled: boolean;
  relatedTransactionId?: string;
  // FR-009: サブカテゴリ関連フィールド
  subcategoryId?: string | null;
  classificationConfidence?: number | null;
  classificationReason?: ClassificationReason | null;
  merchantId?: string | null;
  confirmedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  parentId?: string;
  icon?: string;
  color?: string;
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PAID = 'paid',
  UNPAID = 'unpaid',
  PARTIAL = 'partial',
  OVERDUE = 'overdue',
}
