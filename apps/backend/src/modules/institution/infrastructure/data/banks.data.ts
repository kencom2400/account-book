import { Bank, BankCategory } from '@account-book/types';

/**
 * 対応銀行マスターデータ
 * 実際のプロジェクトでは、外部ファイルやデータベースから読み込むことを推奨
 */
export const SUPPORTED_BANKS: Bank[] = [
  // メガバンク
  {
    id: 'bank_mufg',
    code: '0005',
    name: '三菱UFJ銀行',
    category: BankCategory.MEGA_BANK,
    isSupported: true,
  },
  {
    id: 'bank_smbc',
    code: '0009',
    name: '三井住友銀行',
    category: BankCategory.MEGA_BANK,
    isSupported: true,
  },
  {
    id: 'bank_mizuho',
    code: '0001',
    name: 'みずほ銀行',
    category: BankCategory.MEGA_BANK,
    isSupported: true,
  },
  {
    id: 'bank_resona',
    code: '0010',
    name: 'りそな銀行',
    category: BankCategory.MEGA_BANK,
    isSupported: true,
  },

  // ネット銀行
  {
    id: 'bank_rakuten',
    code: '0036',
    name: '楽天銀行',
    category: BankCategory.ONLINE_BANK,
    isSupported: true,
  },
  {
    id: 'bank_sbi',
    code: '0038',
    name: '住信SBIネット銀行',
    category: BankCategory.ONLINE_BANK,
    isSupported: true,
  },
  {
    id: 'bank_paypay',
    code: '0033',
    name: 'PayPay銀行',
    category: BankCategory.ONLINE_BANK,
    isSupported: true,
  },
  {
    id: 'bank_sony',
    code: '0035',
    name: 'ソニー銀行',
    category: BankCategory.ONLINE_BANK,
    isSupported: true,
  },

  // 地方銀行（サンプル）
  {
    id: 'bank_yokohama',
    code: '0138',
    name: '横浜銀行',
    category: BankCategory.REGIONAL_BANK,
    isSupported: true,
  },
  {
    id: 'bank_chiba',
    code: '0134',
    name: '千葉銀行',
    category: BankCategory.REGIONAL_BANK,
    isSupported: true,
  },

  // テスト用銀行
  {
    id: 'bank_test',
    code: '0000',
    name: 'テスト銀行',
    category: BankCategory.ONLINE_BANK,
    isSupported: true,
  },
];
