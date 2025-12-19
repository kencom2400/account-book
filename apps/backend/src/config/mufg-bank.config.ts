import { registerAs } from '@nestjs/config';

/**
 * 三菱UFJ銀行API設定
 * 環境変数からAPIキーとシークレットを取得
 */
export default registerAs('mufgBank', () => ({
  apiBaseUrl:
    process.env.MUFG_API_BASE_URL ||
    'https://developer.api.bk.mufg.jp/btmu/retail/trial/v2/me/accounts',
  clientId: process.env.MUFG_API_CLIENT_ID || '',
  clientSecret: process.env.MUFG_API_CLIENT_SECRET || '',
  timeout: parseInt(process.env.MUFG_API_TIMEOUT_MS || '30000', 10),
}));
