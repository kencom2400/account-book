import { CardCompany, CardCompanyCategory } from '@account-book/types';

/**
 * 対応カード会社マスターデータ
 * 実際のプロジェクトでは、外部ファイルやデータベースから読み込むことを推奨
 */
export const SUPPORTED_CARD_COMPANIES: CardCompany[] = [
  // 大手カード会社
  {
    id: 'card_smbc',
    code: 'SMBC',
    name: '三井住友カード',
    category: CardCompanyCategory.MAJOR,
    isSupported: true,
  },
  {
    id: 'card_jcb',
    code: 'JCB',
    name: 'JCB',
    category: CardCompanyCategory.MAJOR,
    isSupported: true,
  },
  {
    id: 'card_uc',
    code: 'UC',
    name: 'ユーシーカード',
    category: CardCompanyCategory.MAJOR,
    isSupported: true,
  },
  {
    id: 'card_dc',
    code: 'DC',
    name: 'ダイナースクラブ',
    category: CardCompanyCategory.MAJOR,
    isSupported: true,
  },

  // 銀行系カード
  {
    id: 'card_mufg',
    code: 'MUFG',
    name: '三菱UFJニコス',
    category: CardCompanyCategory.BANK,
    isSupported: true,
  },
  {
    id: 'card_mizuho',
    code: 'MIZUHO',
    name: 'みずほカード',
    category: CardCompanyCategory.BANK,
    isSupported: true,
  },
  {
    id: 'card_resona',
    code: 'RESONA',
    name: 'りそなカード',
    category: CardCompanyCategory.BANK,
    isSupported: true,
  },

  // 流通系カード
  {
    id: 'card_aeon',
    code: 'AEON',
    name: 'イオンカード',
    category: CardCompanyCategory.RETAIL,
    isSupported: true,
  },
  {
    id: 'card_seven',
    code: 'SEVEN',
    name: 'セブンカード',
    category: CardCompanyCategory.RETAIL,
    isSupported: true,
  },

  // ネット系カード
  {
    id: 'card_rakuten',
    code: 'RAKUTEN',
    name: '楽天カード',
    category: CardCompanyCategory.ONLINE,
    isSupported: true,
  },
  {
    id: 'card_amazon',
    code: 'AMAZON',
    name: 'Amazonカード',
    category: CardCompanyCategory.ONLINE,
    isSupported: true,
  },
  {
    id: 'card_yahoo',
    code: 'YAHOO',
    name: 'Yahoo!カード',
    category: CardCompanyCategory.ONLINE,
    isSupported: true,
  },

  // テスト用カード会社
  {
    id: 'card_test',
    code: 'TEST',
    name: 'テストカード',
    category: CardCompanyCategory.ONLINE,
    isSupported: true,
  },
];
