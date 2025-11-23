/**
 * 接続ステータスの型定義
 * Domain層で共通利用される型
 */

/**
 * 公開APIで使用する接続ステータス型
 * ConnectionStatus enumの値のうち、外部に公開する値のみを含む
 */
export type ConnectionStatusType = 'CONNECTED' | 'DISCONNECTED' | 'NEED_REAUTH';

/**
 * 金融機関タイプの型定義
 */
export type InstitutionType = 'bank' | 'credit-card' | 'securities';

/**
 * ConnectionStatus enumの値が公開可能な型かどうかを判定する型ガード関数
 * @param status - 判定対象のステータス
 * @returns 公開可能なステータスの場合true
 */
export function isPublicConnectionStatus(
  status: string,
): status is ConnectionStatusType {
  return ['CONNECTED', 'DISCONNECTED', 'NEED_REAUTH'].includes(status);
}
