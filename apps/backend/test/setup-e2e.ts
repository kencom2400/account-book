// E2Eテスト用の環境変数設定
// テスト実行前に環境変数を設定する

// ENCRYPTION_KEYが設定されていない場合、テスト用のダミーキーを設定
if (!process.env.ENCRYPTION_KEY) {
  // テスト用の32バイトのダミーキー（Base64エンコード）
  // 実際の本番環境では使用しないこと
  process.env.ENCRYPTION_KEY =
    'dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcy1mb3ItZTJlLXRlc3Q=';
}

// CRYPTO_SALTが設定されていない場合、テスト用のダミーソルトを設定
if (!process.env.CRYPTO_SALT) {
  // テスト用の16バイトのダミーソルト（Base64エンコード）
  // 実際の本番環境では使用しないこと
  process.env.CRYPTO_SALT = 'dGVzdC1zYWx0LTE2LWJ5dGVz';
}

// NODE_ENVが設定されていない場合、testに設定
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

// PORTが設定されていない場合、テスト用のポートを設定
if (!process.env.PORT) {
  process.env.PORT = '3001';
}
