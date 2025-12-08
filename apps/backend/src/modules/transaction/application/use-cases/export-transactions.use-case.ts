import { Injectable } from '@nestjs/common';
import { GetTransactionsUseCase } from './get-transactions.use-case';
import type { GetTransactionsQuery } from './get-transactions.use-case';
import { ExportService, ExportFormat } from '../services/export.service';

export interface ExportTransactionsQuery extends GetTransactionsQuery {
  format: ExportFormat;
}

/**
 * 取引データエクスポートユースケース
 */
@Injectable()
export class ExportTransactionsUseCase {
  constructor(
    private readonly getTransactionsUseCase: GetTransactionsUseCase,
    private readonly exportService: ExportService,
  ) {}

  /**
   * 取引データをエクスポート
   */
  async execute(query: ExportTransactionsQuery): Promise<{
    content: string;
    filename: string;
    mimeType: string;
  }> {
    // 取引データを取得
    // formatを除いたクエリパラメータをそのまま渡す
    const { format: _format, ...getTransactionsQuery } = query;
    const transactions =
      await this.getTransactionsUseCase.execute(getTransactionsQuery);

    // フォーマットに応じて変換
    let content: string;
    let filename: string;
    let mimeType: string;

    if (query.format === ExportFormat.CSV) {
      content = this.exportService.convertToCSV(transactions);
      filename = this.generateFilename('csv', query);
      mimeType = 'text/csv; charset=utf-8';
    } else {
      content = this.exportService.convertToJSON(transactions);
      filename = this.generateFilename('json', query);
      mimeType = 'application/json; charset=utf-8';
    }

    return {
      content,
      filename,
      mimeType,
    };
  }

  /**
   * ファイル名を生成
   */
  private generateFilename(
    extension: string,
    query: ExportTransactionsQuery,
  ): string {
    const prefix = 'transactions';

    // 期間指定がある場合
    if (query.year && query.month) {
      const monthStr = String(query.month).padStart(2, '0');
      return `${prefix}_${query.year}-${monthStr}.${extension}`;
    }

    if (query.year) {
      return `${prefix}_${query.year}.${extension}`;
    }

    if (query.startDate && query.endDate) {
      const startStr = this.exportService.formatDate(query.startDate);
      const endStr = this.exportService.formatDate(query.endDate);
      return `${prefix}_${startStr}_${endStr}.${extension}`;
    }

    // デフォルト
    const now = new Date();
    const dateStr = this.exportService.formatDate(now);
    return `${prefix}_${dateStr}.${extension}`;
  }
}
