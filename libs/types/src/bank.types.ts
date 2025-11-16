/**
 * 銀行関連の型定義
 */

/**
 * 銀行カテゴリ
 */
export enum BankCategory {
  MEGA_BANK = 'mega_bank', // メガバンク
  REGIONAL_BANK = 'regional_bank', // 地方銀行
  ONLINE_BANK = 'online_bank', // ネット銀行
}

/**
 * 銀行情報
 */
export interface Bank {
  id: string;
  code: string; // 銀行コード（4桁）
  name: string;
  category: BankCategory;
  isSupported: boolean;
}

/**
 * 銀行認証情報（平文）
 */
export interface BankCredentials {
  bankCode: string; // 銀行コード（4桁数字）
  branchCode: string; // 支店コード（3桁数字）
  accountNumber: string; // 口座番号（7桁数字）
  apiKey?: string; // APIキー（銀行によって異なる）
  apiSecret?: string; // APIシークレット（銀行によって異なる）
  [key: string]: any; // その他の銀行固有の認証情報
}

/**
 * 銀行口座情報
 */
export interface BankAccountInfo {
  bankName: string;
  branchName: string;
  accountNumber: string;
  accountHolder: string;
  accountType: BankAccountType;
  balance: number;
  availableBalance: number;
}

/**
 * 口座種別
 */
export enum BankAccountType {
  ORDINARY = 'ordinary', // 普通預金
  CURRENT = 'current', // 当座預金
  SAVINGS = 'savings', // 貯蓄預金
  TIME_DEPOSIT = 'time_deposit', // 定期預金
}

/**
 * 銀行取引履歴
 */
export interface BankTransaction {
  transactionId: string; // 銀行側の取引ID
  date: string; // 取引日時（ISO 8601）
  type: BankTransactionType;
  amount: number;
  balance: number;
  description: string; // 摘要・メモ
  counterParty?: string; // 取引相手
}

/**
 * 取引種別
 */
export enum BankTransactionType {
  DEPOSIT = 'deposit', // 入金
  WITHDRAWAL = 'withdrawal', // 出金
  TRANSFER_IN = 'transfer_in', // 振込入金
  TRANSFER_OUT = 'transfer_out', // 振込出金
  FEE = 'fee', // 手数料
  INTEREST = 'interest', // 利息
}

/**
 * 銀行接続テスト結果
 */
export interface BankConnectionTestResult {
  success: boolean;
  message: string;
  accountInfo?: BankAccountInfo;
  errorCode?: string;
}

