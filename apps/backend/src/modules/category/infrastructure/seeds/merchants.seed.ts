/**
 * 店舗マスタシードデータ
 * FR-009: 詳細費目分類機能のための初期データ
 */
export const merchantSeedData = [
  // ========================================
  // 食費 - 食料品
  // ========================================
  {
    id: 'merchant_supermarket_aeon',
    name: 'イオン',
    aliases: ['AEON', 'aeon', 'イオンモール'],
    defaultSubcategoryId: 'food_groceries',
    confidence: 0.95,
  },
  {
    id: 'merchant_supermarket_life',
    name: 'ライフ',
    aliases: ['LIFE', 'life'],
    defaultSubcategoryId: 'food_groceries',
    confidence: 0.95,
  },
  {
    id: 'merchant_supermarket_seiyu',
    name: '西友',
    aliases: ['SEIYU', 'seiyu', 'セイユー'],
    defaultSubcategoryId: 'food_groceries',
    confidence: 0.95,
  },

  // ========================================
  // 食費 - カフェ
  // ========================================
  {
    id: 'merchant_cafe_starbucks',
    name: 'スターバックス',
    aliases: ['Starbucks', 'STARBUCKS', 'starbucks', 'スタバ'],
    defaultSubcategoryId: 'food_cafe',
    confidence: 0.95,
  },
  {
    id: 'merchant_cafe_doutor',
    name: 'ドトール',
    aliases: ['DOUTOR', 'doutor', 'ドトールコーヒー'],
    defaultSubcategoryId: 'food_cafe',
    confidence: 0.95,
  },
  {
    id: 'merchant_cafe_tullys',
    name: 'タリーズ',
    aliases: ["TULLY'S", "tully's", "Tully's", 'タリーズコーヒー'],
    defaultSubcategoryId: 'food_cafe',
    confidence: 0.95,
  },

  // ========================================
  // 食費 - 外食
  // ========================================
  {
    id: 'merchant_restaurant_mcdonalds',
    name: 'マクドナルド',
    aliases: ["McDonald's", "MCDONALD'S", 'mcdonalds', 'マック'],
    defaultSubcategoryId: 'food_dining_out',
    confidence: 0.95,
  },
  {
    id: 'merchant_restaurant_yoshinoya',
    name: '吉野家',
    aliases: ['YOSHINOYA', 'yoshinoya'],
    defaultSubcategoryId: 'food_dining_out',
    confidence: 0.95,
  },
  {
    id: 'merchant_restaurant_sukiya',
    name: 'すき家',
    aliases: ['SUKIYA', 'sukiya', 'スキヤ'],
    defaultSubcategoryId: 'food_dining_out',
    confidence: 0.95,
  },

  // ========================================
  // 日用品
  // ========================================
  {
    id: 'merchant_drugstore_matsukiyo',
    name: 'マツモトキヨシ',
    aliases: ['マツキヨ', 'matsukiyo', 'MATSUKIYO'],
    defaultSubcategoryId: 'daily_supplies',
    confidence: 0.95,
  },
  {
    id: 'merchant_drugstore_cocokara',
    name: 'ココカラファイン',
    aliases: ['ココカラ', 'cocokara', 'COCOKARA'],
    defaultSubcategoryId: 'daily_supplies',
    confidence: 0.95,
  },
  {
    id: 'merchant_fashion_uniqlo',
    name: 'ユニクロ',
    aliases: ['UNIQLO', 'uniqlo'],
    defaultSubcategoryId: 'daily_clothes',
    confidence: 0.95,
  },
  {
    id: 'merchant_fashion_gu',
    name: 'ジーユー',
    aliases: ['GU', 'gu', 'G.U.'],
    defaultSubcategoryId: 'daily_clothes',
    confidence: 0.95,
  },

  // ========================================
  // 交通費
  // ========================================
  {
    id: 'merchant_transport_jr',
    name: 'JR東日本',
    aliases: ['JR', 'jr', 'JR East', 'ジェイアール'],
    defaultSubcategoryId: 'transport_train_bus',
    confidence: 0.95,
  },
  {
    id: 'merchant_transport_metro',
    name: '東京メトロ',
    aliases: ['TOKYO METRO', 'tokyo metro', 'メトロ', '地下鉄'],
    defaultSubcategoryId: 'transport_train_bus',
    confidence: 0.95,
  },
  {
    id: 'merchant_ic_suica',
    name: 'Suica',
    aliases: ['SUICA', 'suica', 'スイカ'],
    defaultSubcategoryId: 'transport_train_bus',
    confidence: 0.9,
  },
  {
    id: 'merchant_ic_pasmo',
    name: 'PASMO',
    aliases: ['pasmo', 'パスモ'],
    defaultSubcategoryId: 'transport_train_bus',
    confidence: 0.9,
  },

  // ========================================
  // 通信費
  // ========================================
  {
    id: 'merchant_mobile_docomo',
    name: 'NTTドコモ',
    aliases: ['docomo', 'DOCOMO', 'ドコモ'],
    defaultSubcategoryId: 'communication_mobile',
    confidence: 0.95,
  },
  {
    id: 'merchant_mobile_au',
    name: 'au',
    aliases: ['AU', 'エーユー', 'KDDI'],
    defaultSubcategoryId: 'communication_mobile',
    confidence: 0.95,
  },
  {
    id: 'merchant_mobile_softbank',
    name: 'ソフトバンク',
    aliases: ['SoftBank', 'SOFTBANK', 'softbank'],
    defaultSubcategoryId: 'communication_mobile',
    confidence: 0.95,
  },

  // ========================================
  // 水道光熱費
  // ========================================
  {
    id: 'merchant_utility_tepco',
    name: '東京電力',
    aliases: ['TEPCO', 'tepco', 'とうきょうでんりょく'],
    defaultSubcategoryId: 'utilities_electricity',
    confidence: 0.95,
  },
  {
    id: 'merchant_utility_tokyo_gas',
    name: '東京ガス',
    aliases: ['TOKYO GAS', 'tokyo gas', 'とうきょうがす'],
    defaultSubcategoryId: 'utilities_gas',
    confidence: 0.95,
  },
];
