import type { ConnectionStatusType, InstitutionType } from './connection.types';

/**
 * 接続状態チェック結果
 * Domain層に配置され、接続状態チェックの結果を表現する
 */
export interface ConnectionStatusResult {
  institutionId: string;
  institutionName: string;
  institutionType: InstitutionType;
  status: ConnectionStatusType;
  checkedAt: string;
  responseTime: number;
  errorMessage?: string;
  errorCode?: string;
}
