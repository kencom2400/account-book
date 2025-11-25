import { CategoryType } from './enums/category-type.enum';
import { PaymentStatus } from './transaction.types';

/**
 * クレジットカード情報
 */
export interface CreditCard {
  id: string;
  cardName: string;
  cardNumber: string; // 下4桁のみ
  cardHolderName: string;
  expiryDate: Date;
  credentials: {
    encrypted: string;
    iv: string;
  };
  isConnected: boolean;
  lastSyncedAt: Date | null;
  paymentDay: number; // 引き落とし日（1-31）
  closingDay: number; // 締め日（1-31）
  creditLimit: number; // 利用限度額
  currentBalance: number; // 現在の利用残高
  availableCredit: number; // 利用可能残高
  utilizationRate: number; // 利用率（パーセンテージ）
  issuer: string; // カード発行会社
  isExpired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * クレジットカード取引明細
 */
export interface CreditCardTransaction {
  id: string;
  creditCardId: string;
  transactionDate: Date;
  postingDate: Date; // 計上日
  amount: number;
  merchantName: string;
  merchantCategory: string;
  description: string;
  category: CategoryType;
  isInstallment: boolean; // 分割払いかどうか
  installmentCount: number | null; // 分割回数
  installmentNumber: number | null; // 現在の回数（例: 3/12）
  monthlyInstallmentAmount: number | null; // 月額分割額
  isPaid: boolean; // 支払済みかどうか
  paymentScheduledDate: Date | null; // 支払予定日
  paidDate: Date | null; // 実際の支払日
  createdAt: Date;
  updatedAt: Date;
}

/**
 * クレジットカード支払い情報
 */
export interface Payment {
  billingMonth: string; // YYYY-MM形式
  closingDate: Date; // 締め日
  paymentDueDate: Date; // 支払期限
  totalAmount: number; // 請求総額
  paidAmount: number; // 支払済み額
  remainingAmount: number; // 未払い額
  status: PaymentStatus;
  paidDate: Date | null; // 支払完了日
  paymentProgress: number; // 支払い進捗率（パーセンテージ）
  isPaid: boolean;
  isPartiallyPaid: boolean;
  isOverdue: boolean;
}

/**
 * クレジットカード月別集計情報
 * FR-012: クレジットカード月別集計
 */
export interface MonthlyCardSummary {
  cardId: string;
  cardName: string;
  billingMonth: string; // YYYY-MM
  closingDate: Date;
  paymentDate: Date;
  totalAmount: number;
  transactionCount: number;
  categoryBreakdown: CategoryAmount[];
  transactions: CreditCardTransaction[];
  discounts: Discount[];
  netPaymentAmount: number;
  status: PaymentStatus;
}

/**
 * カテゴリ別金額
 */
export interface CategoryAmount {
  category: CategoryType;
  amount: number;
  count: number;
}

/**
 * 割引情報
 */
export interface Discount {
  type: 'POINT' | 'CASHBACK' | 'CAMPAIGN';
  amount: number;
  description: string;
}

/**
 * 照合結果
 * FR-013: 銀行引落額との自動照合
 */
export interface ReconciliationResult {
  isMatched: boolean;
  confidence: number; // 0-100
  bankTransaction?: {
    id: string;
    date: Date;
    amount: number;
    description: string;
  };
  cardSummary: MonthlyCardSummary;
  discrepancy?: Discrepancy;
}

/**
 * 不一致情報
 */
export interface Discrepancy {
  expectedAmount: number;
  actualAmount: number;
  difference: number;
  reason?: string;
}

/**
 * 照合レポート
 */
export interface ReconciliationReport {
  reconciliationId: string;
  executedAt: Date;
  cardId: string;
  billingMonth: string;
  status: ReconciliationStatus;
  results: ReconciliationResult[];
  summary: {
    total: number;
    matched: number;
    unmatched: number;
    partial: number;
  };
}

/**
 * 照合ステータス
 */
export enum ReconciliationStatus {
  MATCHED = 'matched',
  UNMATCHED = 'unmatched',
  PARTIAL = 'partial',
}

/**
 * アラートレベル
 * FR-015: 不一致時のアラート表示
 */
export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * アラート種別
 */
export enum AlertType {
  AMOUNT_MISMATCH = 'amount_mismatch',
  PAYMENT_NOT_FOUND = 'payment_not_found',
  OVERDUE = 'overdue',
  MULTIPLE_CANDIDATES = 'multiple_candidates',
}

/**
 * アラート情報
 */
export interface Alert {
  id: string;
  type: AlertType;
  level: AlertLevel;
  title: string;
  message: string;
  details: AlertDetails;
  createdAt: Date;
  isRead: boolean;
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNote?: string;
  actions: AlertAction[];
}

/**
 * アラート詳細
 */
export interface AlertDetails {
  cardId: string;
  cardName: string;
  billingMonth: string;
  expectedAmount: number;
  actualAmount?: number;
  discrepancy?: number;
  relatedTransactions: string[];
}

/**
 * アラートアクション
 */
export interface AlertAction {
  id: string;
  label: string;
  action: ActionType;
  isPrimary: boolean;
}

/**
 * アクション種別
 */
export enum ActionType {
  VIEW_DETAILS = 'view_details',
  MANUAL_MATCH = 'manual_match',
  MARK_RESOLVED = 'mark_resolved',
  CONTACT_BANK = 'contact_bank',
  IGNORE = 'ignore',
}
