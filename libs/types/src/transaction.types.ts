export enum CategoryType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
  REPAYMENT = 'repayment',
  INVESTMENT = 'investment',
}

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

