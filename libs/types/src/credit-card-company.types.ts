/**
 * クレジットカード会社関連の型定義
 */

/**
 * カード会社カテゴリ
 */
export enum CardCompanyCategory {
  MAJOR = 'major', // 大手カード会社
  BANK = 'bank', // 銀行系カード
  RETAIL = 'retail', // 流通系カード
  ONLINE = 'online', // ネット系カード
}

/**
 * カード会社情報
 */
export interface CardCompany {
  id: string;
  code: string; // カード会社コード
  name: string;
  category: CardCompanyCategory;
  isSupported: boolean;
}

/**
 * クレジットカード認証情報（平文）
 */
export interface CreditCardCredentials {
  cardNumber: string; // カード番号（16桁）
  cardHolderName: string; // カード名義
  expiryDate: string; // 有効期限（YYYY-MM-DD形式）
  username: string; // Web明細ログインID
  password: string; // Web明細パスワード
  apiKey?: string; // API認証キー（カード会社によって異なる）
  [key: string]: unknown; // その他のカード会社固有の認証情報
}

/**
 * クレジットカード接続テスト結果
 */
export interface CreditCardConnectionTestResult {
  success: boolean;
  message: string;
  cardInfo?: {
    cardName: string;
    cardNumber: string; // 下4桁のみ
    cardHolderName: string;
    expiryDate: string;
    issuer: string;
  };
  errorCode?: string;
}
