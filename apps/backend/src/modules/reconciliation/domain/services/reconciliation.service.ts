import { TransactionEntity } from '../../../transaction/domain/entities/transaction.entity';
import { MonthlyCardSummary } from '../../../aggregation/domain/entities/monthly-card-summary.entity';
import { ReconciliationResult } from '../value-objects/reconciliation-result.vo';
import { Discrepancy } from '../value-objects/discrepancy.vo';

/**
 * 照合サービス
 *
 * 照合ロジックの実装
 */
export class ReconciliationService {
  /**
   * カード請求と銀行取引を照合
   */
  reconcilePayment(
    cardSummary: MonthlyCardSummary,
    bankTransactions: TransactionEntity[],
  ): ReconciliationResult {
    // 日付範囲でフィルタリング（引落予定日 ± 3営業日）
    const dateRangeCandidates = this.filterByDateRange(
      bankTransactions,
      cardSummary.paymentDate,
      3, // ±3営業日
    );

    // 金額でフィルタリング
    const amountMatches = this.filterByAmount(
      dateRangeCandidates,
      cardSummary.netPaymentAmount,
    );

    // 摘要でフィルタリング
    const descriptionMatches = this.filterByDescription(
      amountMatches,
      cardSummary.cardName,
    );

    // 完全一致（1件のみ）
    if (descriptionMatches.length === 1) {
      const matchedTransaction = descriptionMatches[0];
      const confidence = ReconciliationResult.calculateConfidence(
        true, // amountMatch
        true, // dateMatch
        true, // descriptionMatch
      );

      return new ReconciliationResult(
        true,
        confidence,
        matchedTransaction.id,
        cardSummary.id,
        matchedTransaction.date,
        null,
      );
    }

    // 部分一致（金額・日付のみ一致）
    if (amountMatches.length > 0) {
      const bestMatch = amountMatches[0]; // 最も近い日付の取引を選択
      const confidence = ReconciliationResult.calculateConfidence(
        true, // amountMatch
        true, // dateMatch
        false, // descriptionMatch
      );

      const dateDifference = this.calculateBusinessDays(
        cardSummary.paymentDate,
        bestMatch.date,
      );

      const discrepancy = new Discrepancy(
        0, // amountDifference（金額は一致）
        dateDifference,
        false, // descriptionMatch
        '金額・日付は一致しましたが、摘要が一致しませんでした',
      );

      return new ReconciliationResult(
        false,
        confidence,
        null,
        cardSummary.id,
        null,
        discrepancy,
      );
    }

    // 不一致
    const discrepancy = this.analyzeDiscrepancy(cardSummary, bankTransactions);

    return new ReconciliationResult(
      false,
      0,
      null,
      cardSummary.id,
      null,
      discrepancy,
    );
  }

  /**
   * 日付範囲でフィルタリング（営業日計算）
   */
  private filterByDateRange(
    transactions: TransactionEntity[],
    paymentDate: Date,
    businessDays: number,
  ): TransactionEntity[] {
    const startDate = this.subtractBusinessDays(paymentDate, businessDays);
    const endDate = this.addBusinessDays(paymentDate, businessDays);

    return transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      txDate.setHours(0, 0, 0, 0);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      return txDate >= start && txDate <= end;
    });
  }

  /**
   * 金額でフィルタリング
   */
  private filterByAmount(
    transactions: TransactionEntity[],
    amount: number,
  ): TransactionEntity[] {
    return transactions.filter((tx) => tx.amount === amount);
  }

  /**
   * 摘要でフィルタリング
   */
  private filterByDescription(
    transactions: TransactionEntity[],
    cardName: string,
  ): TransactionEntity[] {
    const normalizedCardName = this.normalizeCardName(cardName);

    return transactions.filter((tx) => {
      const normalizedDescription = this.normalizeText(tx.description);
      return this.matchesCardCompany(normalizedDescription, normalizedCardName);
    });
  }

  /**
   * カード会社名が摘要に含まれるか判定
   */
  private matchesCardCompany(description: string, cardName: string): boolean {
    // カード会社名のキーワードを抽出
    const keywords = this.extractCardKeywords(cardName);

    // 摘要にキーワードが含まれるか判定
    return keywords.some((keyword) => description.includes(keyword));
  }

  /**
   * カード名からキーワードを抽出
   */
  private extractCardKeywords(cardName: string): string[] {
    const normalized = this.normalizeCardName(cardName);
    const keywords: string[] = [];

    // 「カード」「クレジット」などのキーワードを追加
    if (normalized.includes('カード') || normalized.includes('カ－ド')) {
      keywords.push('カード');
      keywords.push('カ－ド');
    }
    if (normalized.includes('クレジット')) {
      keywords.push('クレジット');
    }

    // カード会社名の主要部分を抽出（例: 「三井住友」→「三井住友」）
    const companyNames = [
      '三井住友',
      '三菱UFJ',
      'みずほ',
      '楽天',
      'JCB',
      'アメリカン・エクスプレス',
      'ダイナース',
    ];

    for (const companyName of companyNames) {
      if (normalized.includes(companyName)) {
        keywords.push(companyName);
      }
    }

    return keywords.length > 0 ? keywords : ['カード', 'カ－ド', 'クレジット'];
  }

  /**
   * カード名を正規化
   */
  private normalizeCardName(cardName: string): string {
    return cardName
      .replace(/\s+/g, '')
      .replace(/[ー－]/g, '')
      .toLowerCase();
  }

  /**
   * テキストを正規化
   */
  private normalizeText(text: string): string {
    return text
      .replace(/\s+/g, '')
      .replace(/[ー－]/g, '')
      .toLowerCase();
  }

  /**
   * 営業日を減算
   */
  private subtractBusinessDays(date: Date, days: number): Date {
    let currentDate = new Date(date);
    let remainingDays = days;

    while (remainingDays > 0) {
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() - 1);

      if (this.isBusinessDay(currentDate)) {
        remainingDays--;
      }
    }

    return currentDate;
  }

  /**
   * 営業日を加算
   */
  private addBusinessDays(date: Date, days: number): Date {
    let currentDate = new Date(date);
    let remainingDays = days;

    while (remainingDays > 0) {
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + 1);

      if (this.isBusinessDay(currentDate)) {
        remainingDays--;
      }
    }

    return currentDate;
  }

  /**
   * 営業日かどうかを判定（土日を除外）
   */
  private isBusinessDay(date: Date): boolean {
    const dayOfWeek = date.getDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6; // 0=日曜日, 6=土曜日
  }

  /**
   * 営業日数を計算
   */
  private calculateBusinessDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);
    const end = new Date(endDate);

    // 開始日と終了日のどちらが前か判定
    const isStartBeforeEnd = current <= end;
    const increment = isStartBeforeEnd ? 1 : -1;

    while (current.getTime() !== end.getTime()) {
      if (this.isBusinessDay(current)) {
        count++;
      }
      current.setDate(current.getDate() + increment);
    }

    // 終了日も含める
    if (this.isBusinessDay(end)) {
      count++;
    }

    return isStartBeforeEnd ? count : -count;
  }

  /**
   * 不一致を分析
   */
  private analyzeDiscrepancy(
    cardSummary: MonthlyCardSummary,
    bankTransactions: TransactionEntity[],
  ): Discrepancy {
    // 日付範囲内の取引を取得
    const dateRangeTransactions = this.filterByDateRange(
      bankTransactions,
      cardSummary.paymentDate,
      3,
    );

    // 最も近い金額の取引を探す
    let closestTransaction: TransactionEntity | null = null;
    let minAmountDifference = Infinity;

    for (const tx of dateRangeTransactions) {
      const amountDifference = Math.abs(
        tx.amount - cardSummary.netPaymentAmount,
      );
      if (amountDifference < minAmountDifference) {
        minAmountDifference = amountDifference;
        closestTransaction = tx;
      }
    }

    if (closestTransaction) {
      const dateDifference = this.calculateBusinessDays(
        cardSummary.paymentDate,
        closestTransaction.date,
      );
      const descriptionMatch = this.matchesCardCompany(
        this.normalizeText(closestTransaction.description),
        this.normalizeCardName(cardSummary.cardName),
      );

      let reason = '照合対象が見つかりませんでした';
      if (minAmountDifference > 0) {
        reason += `（最も近い金額との差: ${minAmountDifference}円）`;
      }
      if (dateDifference !== 0) {
        reason += `（日付差: ${dateDifference}営業日）`;
      }
      if (!descriptionMatch) {
        reason += '（摘要不一致）';
      }

      return new Discrepancy(
        minAmountDifference,
        dateDifference,
        descriptionMatch,
        reason,
      );
    }

    // 取引が見つからない場合
    return new Discrepancy(
      cardSummary.netPaymentAmount, // 金額差（全額）
      0, // 日付差（取引なし）
      false, // 摘要一致フラグ
      '指定期間内に該当する銀行取引が見つかりませんでした',
    );
  }
}
