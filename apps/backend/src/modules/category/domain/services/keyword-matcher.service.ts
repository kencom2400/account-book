import { Injectable } from '@nestjs/common';
import { CategoryType } from '@account-book/types';
import { Subcategory } from '../entities/subcategory.entity';
import { TextNormalizer } from '../utils/text-normalizer.util';

/**
 * キーワードマッチングの結果
 */
export interface KeywordMatchResult {
  subcategory: Subcategory;
  score: number;
}

/**
 * キーワードマッチャー Domain Service
 * キーワードによるサブカテゴリマッチングを担当
 */
@Injectable()
export class KeywordMatcherService {
  // カテゴリ別キーワードマップ
  // 実際の実装ではデータベースや設定ファイルから読み込む
  private readonly keywordMap: Map<CategoryType, Map<string, string[]>> =
    new Map([
      [
        CategoryType.EXPENSE,
        new Map([
          // 食費
          [
            'food_groceries',
            ['スーパー', '食料品', '生鮮', 'イオン', 'ライフ'],
          ],
          ['food_dining_out', ['レストラン', '外食', '居酒屋', '定食']],
          ['food_cafe', ['カフェ', 'スターバックス', 'コーヒー', '喫茶']],
          // 交通費
          [
            'transport_train_bus',
            ['定期券', 'JR', '地下鉄', 'バス', '鉄道', 'Suica', 'PASMO'],
          ],
          ['transport_taxi', ['タクシー', 'Uber', 'ハイヤー']],
          ['transport_parking', ['駐車場', 'パーキング', '駐輪場']],
          // 日用品
          ['daily_supplies', ['ドラッグストア', '日用品', '雑貨', 'マツキヨ']],
          ['daily_clothes', ['衣料品', 'ユニクロ', 'しまむら', 'アパレル']],
          // 通信費
          [
            'communication_mobile',
            ['携帯', 'スマホ', 'docomo', 'au', 'SoftBank'],
          ],
          ['communication_internet', ['インターネット', '光回線', 'Wi-Fi']],
          // 水道・光熱費
          ['utilities_electricity', ['電気', '東京電力', '関西電力']],
          ['utilities_gas', ['ガス', '都市ガス']],
          ['utilities_water', ['水道']],
        ]),
      ],
      [
        CategoryType.INCOME,
        new Map([
          ['income_salary', ['給与', '賞与', 'ボーナス', '月給']],
          ['income_business', ['売上', '収入', '報酬', '事業']],
        ]),
      ],
    ]);

  /**
   * キーワードマッチングでサブカテゴリを取得
   * マッチングスコアも併せて返す
   *
   * @param text 取引説明
   * @param category カテゴリタイプ
   * @param subcategories 候補となるサブカテゴリ一覧
   * @returns マッチしたサブカテゴリとスコア | null
   */
  public match(
    text: string,
    category: CategoryType,
    subcategories: Subcategory[],
  ): KeywordMatchResult | null {
    const normalizedText = TextNormalizer.normalize(text);
    const categoryKeywords = this.keywordMap.get(category);

    if (!categoryKeywords) {
      return null;
    }

    // 各サブカテゴリのキーワードとマッチングスコアを計算
    let bestMatch: KeywordMatchResult | null = null;

    for (const subcategory of subcategories) {
      const keywords = categoryKeywords.get(subcategory.id);
      if (!keywords) {
        continue;
      }

      const score = this.calculateMatchScore(normalizedText, keywords);
      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { subcategory, score };
      }
    }

    return bestMatch;
  }

  /**
   * テキストからキーワードを抽出
   *
   * NOTE: 現在はスペースで分割する簡易実装
   * 日本語の取引明細（単語がスペースで区切られていない）には
   * 有効ではないため、将来的に形態素解析ライブラリ（kuromoji.js等）の
   * 導入を検討する必要がある
   *
   * @param text テキスト
   * @returns キーワード配列
   */
  public extractKeywords(text: string): string[] {
    const normalized = TextNormalizer.normalize(text);
    // 簡易的な実装：スペースで分割
    // TODO: 形態素解析の導入（kuromoji.js等）
    return normalized.split(/\s+/).filter((word) => word.length > 0);
  }

  /**
   * マッチスコアを計算
   * @param text 正規化されたテキスト
   * @param keywords キーワード配列
   * @returns スコア（0-1）
   */
  public calculateMatchScore(text: string, keywords: string[]): number {
    let matchCount = 0;

    for (const keyword of keywords) {
      const normalizedKeyword = TextNormalizer.normalize(keyword);
      if (text.includes(normalizedKeyword)) {
        matchCount++;
      }
    }

    // マッチ率をスコアとして返す
    return matchCount > 0 ? matchCount / keywords.length : 0;
  }
}
