import { Injectable } from '@nestjs/common';
import { CategoryType } from '@account-book/types';

/**
 * CategoryClassificationService
 * FR-008: 取引データの主要カテゴリ自動分類
 *
 * 5つの主要カテゴリ（収入・支出・振替・返済・投資）に自動分類するロジックを実装
 */
@Injectable()
export class CategoryClassificationService {
  // カテゴリごとのキーワード辞書
  // 評価順序: より具体的なカテゴリ（返済・投資・振替）を先に、一般的なカテゴリ（収入・支出）を後に
  private readonly keywords = {
    [CategoryType.REPAYMENT]: [
      'ローン',
      '返済',
      'loan',
      'repayment',
      '住宅ローン',
      '自動車ローン',
      '教育ローン',
    ],
    [CategoryType.INVESTMENT]: [
      '株式',
      '投資信託',
      '債券',
      '売買',
      '配当',
      '分配金',
      '株',
      'fund',
      'stock',
      '証券',
    ],
    [CategoryType.TRANSFER]: [
      '振替',
      'カード引落',
      '口座振替',
      '資金移動',
      'チャージ',
      '送金',
      'transfer',
      '口座間',
    ],
    [CategoryType.INCOME]: [
      '給与',
      '賞与',
      'ボーナス',
      '報酬',
      '利息',
      '売上',
      '還付',
      'キャッシュバック',
      '払戻',
      '返金',
      '振込',
      'salary',
      'bonus',
      '入金',
    ],
    [CategoryType.EXPENSE]: [
      '購入',
      '支払',
      '決済',
      '引落',
      'コンビニ',
      'スーパー',
      'レストラン',
      'カフェ',
      'ガソリン',
      '公共料金',
      '携帯',
      '水道',
      '電気',
      'ガス',
    ],
  };

  /**
   * 取引データを自動分類
   * @param transaction 取引データ
   * @param institutionType 金融機関タイプ
   * @returns 分類結果（カテゴリタイプと信頼度）
   */
  classifyTransaction(
    transaction: {
      amount: number;
      description: string;
      institutionId?: string;
    },
    institutionType?: string,
  ): {
    category: CategoryType;
    confidence: number;
    confidenceLevel: 'high' | 'medium' | 'low';
    reason: string;
  } {
    // 1. 金融機関タイプで判定
    if (institutionType === 'securities') {
      const confidence = 0.95;
      return {
        category: CategoryType.INVESTMENT,
        confidence,
        confidenceLevel: this.evaluateConfidence(confidence),
        reason: '証券口座の取引',
      };
    }

    // 2. キーワードマッチング
    const keywordMatch = this.matchKeywords(transaction.description);
    if (keywordMatch) {
      return keywordMatch;
    }

    // 3. 金額と取引パターンで判定
    const amountBasedCategory = this.classifyByAmount(transaction.amount);
    if (amountBasedCategory) {
      return amountBasedCategory;
    }

    // 4. デフォルト: 支出として分類
    const confidence = 0.5;
    return {
      category: CategoryType.EXPENSE,
      confidence,
      confidenceLevel: this.evaluateConfidence(confidence),
      reason: 'デフォルト分類（支出）',
    };
  }

  /**
   * キーワードマッチングによる分類
   */
  private matchKeywords(description: string): {
    category: CategoryType;
    confidence: number;
    confidenceLevel: 'high' | 'medium' | 'low';
    reason: string;
  } | null {
    const normalizedDesc = description.toLowerCase();

    // 各カテゴリのキーワードをチェック
    for (const [categoryTypeStr, keywords] of Object.entries(this.keywords)) {
      const categoryType = categoryTypeStr as CategoryType;

      for (const keyword of keywords) {
        if (normalizedDesc.includes(keyword.toLowerCase())) {
          const confidence = this.calculateKeywordConfidence(
            normalizedDesc,
            keyword,
          );
          return {
            category: categoryType,
            confidence,
            confidenceLevel: this.evaluateConfidence(confidence),
            reason: `キーワードマッチ: "${keyword}"`,
          };
        }
      }
    }

    return null;
  }

  /**
   * 金額ベースの分類
   */
  private classifyByAmount(amount: number): {
    category: CategoryType;
    confidence: number;
    confidenceLevel: 'high' | 'medium' | 'low';
    reason: string;
  } | null {
    // プラスの金額 = 収入の可能性
    if (amount > 0) {
      const confidence = 0.7;
      return {
        category: CategoryType.INCOME,
        confidence,
        confidenceLevel: this.evaluateConfidence(confidence),
        reason: '入金取引（プラス金額）',
      };
    }

    // マイナスの金額 = 支出の可能性
    if (amount < 0) {
      const confidence = 0.7;
      return {
        category: CategoryType.EXPENSE,
        confidence,
        confidenceLevel: this.evaluateConfidence(confidence),
        reason: '出金取引（マイナス金額）',
      };
    }

    return null;
  }

  /**
   * キーワードマッチの信頼度を計算
   */
  private calculateKeywordConfidence(
    description: string,
    keyword: string,
  ): number {
    // 基本信頼度
    let confidence = 0.8;

    // キーワードが説明の冒頭にある場合は信頼度を上げる
    if (description.startsWith(keyword.toLowerCase())) {
      confidence += 0.1;
    }

    // キーワードが説明全体に対して大きな割合を占める場合
    const ratio = keyword.length / description.length;
    if (ratio > 0.3) {
      confidence += 0.05;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * 振替パターンを検出
   * 2つの取引が振替のペアかどうかを判定
   *
   * @deprecated 現在のclassifyTransactionフローでは使用されていません。
   * 将来的に複数取引を同時に分析する機能で使用予定。
   */
  isTransferPattern(
    transaction1: {
      amount: number;
      date: Date;
      institutionId: string;
    },
    transaction2: {
      amount: number;
      date: Date;
      institutionId: string;
    },
  ): boolean {
    // 金額の絶対値が一致
    if (Math.abs(transaction1.amount) !== Math.abs(transaction2.amount)) {
      return false;
    }

    // 一方がプラス、もう一方がマイナス
    if (
      (transaction1.amount > 0 && transaction2.amount > 0) ||
      (transaction1.amount < 0 && transaction2.amount < 0)
    ) {
      return false;
    }

    // 異なる金融機関
    if (transaction1.institutionId === transaction2.institutionId) {
      return false;
    }

    // 日付が近い（3日以内）
    const daysDiff = this.getDaysDifference(
      transaction1.date,
      transaction2.date,
    );
    if (daysDiff > 3) {
      return false;
    }

    return true;
  }

  /**
   * 2つの日付の差分日数を計算
   */
  private getDaysDifference(date1: Date, date2: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.abs((date1.getTime() - date2.getTime()) / msPerDay);
  }

  /**
   * 分類信頼度を評価
   */
  evaluateConfidence(confidence: number): 'high' | 'medium' | 'low' {
    if (confidence >= 0.9) {
      return 'high';
    } else if (confidence >= 0.7) {
      return 'medium';
    } else {
      return 'low';
    }
  }
}
