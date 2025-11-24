/**
 * テキスト正規化ユーティリティ
 * アプリケーション全体で統一されたテキスト正規化処理を提供
 */
export class TextNormalizer {
  /**
   * テキストを正規化
   * - 小文字化
   * - 全角英数字を半角に変換
   * - 記号を削除
   * - スペースをトリム
   *
   * @param text 正規化するテキスト
   * @returns 正規化されたテキスト
   */
  static normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) =>
        String.fromCharCode(s.charCodeAt(0) - 0xfee0),
      )
      .replace(/[^\w\sぁ-んァ-ヶー一-龯]/g, '')
      .replace(/\s+/g, '')
      .trim();
  }

  /**
   * テキストが部分一致するかチェック
   * 正規化後のテキストで比較
   *
   * @param haystack 検索対象のテキスト
   * @param needle 検索するテキスト
   * @returns true: 一致する
   */
  static includes(haystack: string, needle: string): boolean {
    const normalizedHaystack = this.normalize(haystack);
    const normalizedNeedle = this.normalize(needle);
    return normalizedHaystack.includes(normalizedNeedle);
  }

  /**
   * テキストが完全一致するかチェック
   * 正規化後のテキストで比較
   *
   * @param text1 比較対象1
   * @param text2 比較対象2
   * @returns true: 一致する
   */
  static equals(text1: string, text2: string): boolean {
    return this.normalize(text1) === this.normalize(text2);
  }
}
