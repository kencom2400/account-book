import { CategoryType } from '@account-book/types';

/**
 * サブカテゴリシードデータ
 * FR-009: 詳細費目分類機能のための初期データ
 */
export const subcategorySeedData = [
  // ========================================
  // 収入カテゴリ
  // ========================================
  {
    id: 'income_salary',
    categoryType: CategoryType.INCOME,
    name: '給与・賞与',
    parentId: null,
    displayOrder: 1,
    icon: '💰',
    color: '#4CAF50',
    isDefault: true,
    isActive: true,
  },
  {
    id: 'income_business',
    categoryType: CategoryType.INCOME,
    name: '事業収入',
    parentId: null,
    displayOrder: 2,
    icon: '💼',
    color: '#66BB6A',
    isDefault: false,
    isActive: true,
  },
  {
    id: 'income_other',
    categoryType: CategoryType.INCOME,
    name: 'その他収入',
    parentId: null,
    displayOrder: 99,
    icon: '📦',
    color: '#81C784',
    isDefault: false,
    isActive: true,
  },

  // ========================================
  // 支出カテゴリ - 食費
  // ========================================
  {
    id: 'food',
    categoryType: CategoryType.EXPENSE,
    name: '食費',
    parentId: null,
    displayOrder: 1,
    icon: '🍴',
    color: '#FF6B6B',
    isDefault: false,
    isActive: true,
  },
  {
    id: 'food_groceries',
    categoryType: CategoryType.EXPENSE,
    name: '食料品',
    parentId: 'food',
    displayOrder: 1,
    icon: '🛒',
    color: '#FF8787',
    isDefault: false,
    isActive: true,
  },
  {
    id: 'food_dining_out',
    categoryType: CategoryType.EXPENSE,
    name: '外食',
    parentId: 'food',
    displayOrder: 2,
    icon: '🍽️',
    color: '#FFA5A5',
    isDefault: false,
    isActive: true,
  },
  {
    id: 'food_cafe',
    categoryType: CategoryType.EXPENSE,
    name: 'カフェ・喫茶店',
    parentId: 'food',
    displayOrder: 3,
    icon: '☕',
    color: '#FFC3C3',
    isDefault: false,
    isActive: true,
  },

  // ========================================
  // 支出カテゴリ - 日用品
  // ========================================
  {
    id: 'daily',
    categoryType: CategoryType.EXPENSE,
    name: '日用品',
    parentId: null,
    displayOrder: 2,
    icon: '🏠',
    color: '#4FC3F7',
    isDefault: false,
    isActive: true,
  },
  {
    id: 'daily_supplies',
    categoryType: CategoryType.EXPENSE,
    name: '生活用品',
    parentId: 'daily',
    displayOrder: 1,
    icon: '🧴',
    color: '#81D4FA',
    isDefault: false,
    isActive: true,
  },
  {
    id: 'daily_clothes',
    categoryType: CategoryType.EXPENSE,
    name: '衣料品',
    parentId: 'daily',
    displayOrder: 2,
    icon: '👔',
    color: '#B3E5FC',
    isDefault: false,
    isActive: true,
  },

  // ========================================
  // 支出カテゴリ - 交通費
  // ========================================
  {
    id: 'transport',
    categoryType: CategoryType.EXPENSE,
    name: '交通費',
    parentId: null,
    displayOrder: 3,
    icon: '🚃',
    color: '#2196F3',
    isDefault: false,
    isActive: true,
  },
  {
    id: 'transport_train_bus',
    categoryType: CategoryType.EXPENSE,
    name: '電車・バス',
    parentId: 'transport',
    displayOrder: 1,
    icon: '🚇',
    color: '#42A5F5',
    isDefault: false,
    isActive: true,
  },
  {
    id: 'transport_taxi',
    categoryType: CategoryType.EXPENSE,
    name: 'タクシー',
    parentId: 'transport',
    displayOrder: 2,
    icon: '🚕',
    color: '#64B5F6',
    isDefault: false,
    isActive: true,
  },
  {
    id: 'transport_parking',
    categoryType: CategoryType.EXPENSE,
    name: '駐車場',
    parentId: 'transport',
    displayOrder: 3,
    icon: '🅿️',
    color: '#90CAF9',
    isDefault: false,
    isActive: true,
  },

  // ========================================
  // 支出カテゴリ - 通信費
  // ========================================
  {
    id: 'communication',
    categoryType: CategoryType.EXPENSE,
    name: '通信費',
    parentId: null,
    displayOrder: 4,
    icon: '📱',
    color: '#9C27B0',
    isDefault: false,
    isActive: true,
  },
  {
    id: 'communication_mobile',
    categoryType: CategoryType.EXPENSE,
    name: '携帯電話',
    parentId: 'communication',
    displayOrder: 1,
    icon: '📞',
    color: '#AB47BC',
    isDefault: false,
    isActive: true,
  },
  {
    id: 'communication_internet',
    categoryType: CategoryType.EXPENSE,
    name: 'インターネット',
    parentId: 'communication',
    displayOrder: 2,
    icon: '🌐',
    color: '#BA68C8',
    isDefault: false,
    isActive: true,
  },

  // ========================================
  // 支出カテゴリ - 水道光熱費
  // ========================================
  {
    id: 'utilities',
    categoryType: CategoryType.EXPENSE,
    name: '水道光熱費',
    parentId: null,
    displayOrder: 5,
    icon: '💡',
    color: '#FFC107',
    isDefault: false,
    isActive: true,
  },
  {
    id: 'utilities_electricity',
    categoryType: CategoryType.EXPENSE,
    name: '電気',
    parentId: 'utilities',
    displayOrder: 1,
    icon: '⚡',
    color: '#FFD54F',
    isDefault: false,
    isActive: true,
  },
  {
    id: 'utilities_gas',
    categoryType: CategoryType.EXPENSE,
    name: 'ガス',
    parentId: 'utilities',
    displayOrder: 2,
    icon: '🔥',
    color: '#FFE082',
    isDefault: false,
    isActive: true,
  },
  {
    id: 'utilities_water',
    categoryType: CategoryType.EXPENSE,
    name: '水道',
    parentId: 'utilities',
    displayOrder: 3,
    icon: '💧',
    color: '#FFECB3',
    isDefault: false,
    isActive: true,
  },

  // ========================================
  // 支出カテゴリ - その他
  // ========================================
  {
    id: 'other_expense',
    categoryType: CategoryType.EXPENSE,
    name: 'その他支出',
    parentId: null,
    displayOrder: 99,
    icon: '📦',
    color: '#9E9E9E',
    isDefault: true,
    isActive: true,
  },
];
