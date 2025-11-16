#!/bin/bash

# Issue詳細化スクリプト: FR-001〜007（データ取得機能）

set -e

REPO="kencom2400/account-book"

echo "════════════════════════════════════════════════════════════════"
echo "   📝 Issue詳細化: FR-001〜007（データ取得機能）"
echo "════════════════════════════════════════════════════════════════"
echo ""

# FR-001の詳細化
echo "[1/7] FR-001を詳細化中..."
gh issue edit 23 --repo "$REPO" --body "## 📋 概要
銀行API連携による口座情報・取引履歴の自動取得機能

## 🎯 ユーザーストーリー
口座管理者として、銀行口座と連携して取引履歴を自動取得し、手動入力の手間を削減したい

## 📦 実装内容

### Backend - Domain層
- [ ] Institution Entity（金融機関エンティティ）の実装
- [ ] BankAccount Value Object（銀行口座）の実装
- [ ] Transaction Entity（取引エンティティ）の実装
- [ ] BankConnectionService（ドメインサービス）の実装

### Backend - Application層
- [ ] ConnectBankAccountUseCase の実装
- [ ] FetchTransactionsUseCase の実装
- [ ] RefreshBankConnectionUseCase の実装
- [ ] DisconnectBankAccountUseCase の実装

### Backend - Infrastructure層
- [ ] BankAPIClient インターフェースの定義
- [ ] 具体的な銀行API実装（例: MoneyForward API Client）
- [ ] OAuth2認証フローの実装
- [ ] API Key認証フローの実装
- [ ] 認証情報の暗号化・復号化処理
- [ ] リトライ機構の実装
- [ ] レート制限対応

### Backend - Presentation層
- [ ] POST /api/institutions/banks/connect エンドポイント
- [ ] GET /api/institutions/banks/:id エンドポイント
- [ ] GET /api/institutions/banks/:id/transactions エンドポイント
- [ ] PUT /api/institutions/banks/:id/refresh エンドポイント
- [ ] DELETE /api/institutions/banks/:id/disconnect エンドポイント

## ✅ Acceptance Criteria（受入基準）
- [ ] 銀行APIに正常に接続できる（OAuth2フロー）
- [ ] API Key方式でも接続できる
- [ ] 口座情報（口座番号、残高、口座名）が取得できる
- [ ] 過去3ヶ月分の取引履歴が取得できる
- [ ] 取得した取引データが正しくJSON形式で保存される
- [ ] API接続エラー時に適切なエラーメッセージが返される
- [ ] 接続タイムアウトは30秒以内
- [ ] リトライは最大3回実施される
- [ ] 認証情報がAES-256で暗号化されて保存される
- [ ] 複数の銀行口座に対応できる

## 📋 Definition of Done（完了定義）

### コード
- [ ] すべての実装が完了している
- [ ] コードレビューが完了している
- [ ] ESLint/Prettierエラーがない
- [ ] TypeScript型定義が適切に設定されている
- [ ] エラーハンドリングが適切に実装されている

### テスト
- [ ] Domain層のユニットテストが書かれている（カバレッジ90%以上）
- [ ] Application層のユニットテストが書かれている（カバレッジ85%以上）
- [ ] Infrastructure層のユニットテスト（モック使用）が書かれている
- [ ] APIエンドポイントの統合テストが書かれている
- [ ] すべてのテストがパスしている
- [ ] エラーケースのテストが書かれている

### ドキュメント
- [ ] API仕様書が更新されている（Swagger/OpenAPI）
- [ ] README.mdに銀行連携の設定手順が記載されている
- [ ] 環境変数の設定方法がドキュメント化されている

### セキュリティ
- [ ] 認証情報が平文で保存されていない
- [ ] APIキーが.envファイルで管理されている
- [ ] .envファイルが.gitignoreに含まれている

### デプロイ
- [ ] developブランチにマージ済み
- [ ] CIが成功している
- [ ] 手動動作確認が完了している

## 🔗 Related Issues
- Depends on: #10 (A-6: CI/CD構築)
- Blocks: #29 (FR-006: 取引履歴自動取得)
- Related to: #26 (FR-004: 接続確認), #27 (FR-005: エラー通知)

## 📁 関連ファイル
- \`apps/backend/src/modules/institution/domain/entities/institution.entity.ts\`
- \`apps/backend/src/modules/institution/domain/value-objects/bank-account.vo.ts\`
- \`apps/backend/src/modules/transaction/domain/entities/transaction.entity.ts\`
- \`apps/backend/src/modules/institution/application/use-cases/connect-bank-account.use-case.ts\`
- \`apps/backend/src/modules/institution/infrastructure/clients/bank-api.client.ts\`
- \`apps/backend/src/modules/institution/presentation/controllers/institution.controller.ts\`

## 📚 参考資料
- \`docs/functional-requirements/FR-001-007_data-acquisition.md\`
- \`docs/system-architecture.md\` - 外部API連携セクション
- \`docs/system-architecture.md\` - セキュリティアーキテクチャ

## 💡 実装のヒント
- OAuth2ライブラリ: \`@nestjs/passport\`, \`passport-oauth2\`
- 暗号化: Node.js標準の\`crypto\`モジュール
- HTTP Client: \`axios\` または \`@nestjs/axios\`
- リトライ: \`axios-retry\`
"

echo "  ✅ FR-001 詳細化完了"
echo ""

# FR-002の詳細化
echo "[2/7] FR-002を詳細化中..."
gh issue edit 24 --repo "$REPO" --body "## 📋 概要
クレジットカードAPI連携による利用明細の自動取得機能

## 🎯 ユーザーストーリー
カード利用者として、クレジットカードと連携して利用明細を自動取得し、支払管理を効率化したい

## 📦 実装内容

### Backend - Domain層
- [ ] CreditCard Entity の実装
- [ ] CreditCardTransaction Entity の実装
- [ ] Payment Value Object の実装
- [ ] CreditCardService（ドメインサービス）の実装

### Backend - Application層
- [ ] ConnectCreditCardUseCase の実装
- [ ] FetchCreditCardTransactionsUseCase の実装
- [ ] FetchPaymentInfoUseCase の実装
- [ ] RefreshCreditCardConnectionUseCase の実装

### Backend - Infrastructure層
- [ ] CreditCardAPIClient インターフェースの定義
- [ ] 具体的なカードAPI実装
- [ ] OAuth2認証フローの実装
- [ ] 認証情報の暗号化・保存
- [ ] リトライ機構の実装

### Backend - Presentation層
- [ ] POST /api/institutions/credit-cards/connect エンドポイント
- [ ] GET /api/institutions/credit-cards/:id/transactions エンドポイント
- [ ] GET /api/institutions/credit-cards/:id/payment-info エンドポイント
- [ ] PUT /api/institutions/credit-cards/:id/refresh エンドポイント

## ✅ Acceptance Criteria（受入基準）
- [ ] クレジットカードAPIに正常に接続できる
- [ ] 利用明細（日付、金額、店舗名）が取得できる
- [ ] 請求額と支払期日が取得できる
- [ ] 過去6ヶ月分の利用明細が取得できる
- [ ] 複数のクレジットカードに対応できる
- [ ] カード情報がAES-256で暗号化されて保存される
- [ ] API接続エラー時に適切なエラーメッセージが返される
- [ ] 接続タイムアウトは30秒以内

## 📋 Definition of Done（完了定義）

### コード
- [ ] すべての実装が完了している
- [ ] コードレビューが完了している
- [ ] ESLint/Prettierエラーがない
- [ ] TypeScript型定義が適切

### テスト
- [ ] ユニットテストが書かれている（カバレッジ85%以上）
- [ ] 統合テストが書かれている
- [ ] すべてのテストがパスしている

### ドキュメント
- [ ] API仕様書が更新されている
- [ ] クレジットカード連携の設定手順が記載されている

### セキュリティ
- [ ] カード情報が暗号化されている
- [ ] APIキーが環境変数で管理されている

### デプロイ
- [ ] マージ済み
- [ ] CIが成功している
- [ ] 動作確認完了

## 🔗 Related Issues
- Depends on: #23 (FR-001: 銀行連携)
- Blocks: #33 (FR-012: カード利用明細集計), #34 (FR-013: 銀行引落照合)
- Related to: #29 (FR-006: 取引履歴自動取得)

## 📁 関連ファイル
- \`apps/backend/src/modules/credit-card/domain/entities/credit-card.entity.ts\`
- \`apps/backend/src/modules/credit-card/domain/entities/credit-card-transaction.entity.ts\`
- \`apps/backend/src/modules/credit-card/application/use-cases/\`
- \`apps/backend/src/modules/credit-card/infrastructure/clients/credit-card-api.client.ts\`
- \`apps/backend/src/modules/credit-card/presentation/controllers/credit-card.controller.ts\`

## 📚 参考資料
- \`docs/functional-requirements/FR-001-007_data-acquisition.md\`
- \`docs/functional-requirements/FR-012-015_credit-card.md\`
- \`docs/system-architecture.md\`
"

echo "  ✅ FR-002 詳細化完了"
echo ""

# FR-006の詳細化（重要度が高いため）
echo "[3/7] FR-006を詳細化中..."
gh issue edit 28 --repo "$REPO" --body "## 📋 概要
各金融機関APIから取引履歴を自動的に取得し、ローカルに保存する機能

## 🎯 ユーザーストーリー
ユーザーとして、手動操作なしで取引履歴を自動的に取得し、常に最新のデータで資産管理をしたい

## 📦 実装内容

### Backend - Domain層
- [ ] SyncHistory Entity の実装
- [ ] SyncStatus Enum の実装
- [ ] SyncStrategy インターフェースの定義
- [ ] IncrementalSyncStrategy の実装（差分同期）

### Backend - Application層
- [ ] SyncAllTransactionsUseCase の実装
- [ ] SyncInstitutionTransactionsUseCase の実装
- [ ] GetSyncHistoryUseCase の実装
- [ ] CancelSyncUseCase の実装

### Backend - Infrastructure層
- [ ] ScheduledSyncJob（定期実行ジョブ）の実装
- [ ] SyncOrchestrator（同期オーケストレーター）の実装
- [ ] SyncHistoryRepository の実装
- [ ] リトライ機構の実装
- [ ] 並行同期制御の実装

### Backend - Presentation層
- [ ] POST /api/sync/start エンドポイント（手動同期開始）
- [ ] GET /api/sync/status エンドポイント
- [ ] GET /api/sync/history エンドポイント
- [ ] PUT /api/sync/cancel/:id エンドポイント
- [ ] GET /api/sync/schedule エンドポイント
- [ ] PUT /api/sync/schedule エンドポイント（同期スケジュール設定）

## ✅ Acceptance Criteria（受入基準）
- [ ] 毎日午前4時に自動的に同期が実行される
- [ ] 手動で「今すぐ同期」ボタンから同期を開始できる
- [ ] 差分のみが取得される（重複データは取得されない）
- [ ] 同期進捗状況がリアルタイムで確認できる（WebSocket）
- [ ] エラー発生時は自動的に3回までリトライされる
- [ ] 同期履歴が記録され、後から確認できる
- [ ] 複数の金融機関が同時に同期される（並行実行）
- [ ] 1つの金融機関の同期失敗が他に影響しない
- [ ] 同期中にアプリを閉じても、バックグラウンドで継続される
- [ ] 1000件の取引を10秒以内に同期できる

## 📋 Definition of Done（完了定義）

### コード
- [ ] すべての実装が完了している
- [ ] コードレビューが完了している
- [ ] ESLint/Prettierエラーがない
- [ ] TypeScript型定義が適切
- [ ] エラーハンドリングが適切に実装されている

### テスト
- [ ] Domain層のユニットテストが書かれている（カバレッジ90%以上）
- [ ] Application層のユニットテストが書かれている（カバレッジ85%以上）
- [ ] Scheduled Jobのテストが書かれている
- [ ] 並行同期のテストが書かれている
- [ ] リトライ機構のテストが書かれている
- [ ] パフォーマンステストが書かれている（1000件/10秒）
- [ ] すべてのテストがパスしている

### ドキュメント
- [ ] API仕様書が更新されている
- [ ] 同期の仕組みがドキュメント化されている
- [ ] 同期スケジュール設定方法が記載されている
- [ ] トラブルシューティングガイドが作成されている

### パフォーマンス
- [ ] 1000件の取引を10秒以内に同期できることを確認
- [ ] メモリリークがないことを確認
- [ ] CPU使用率が適切であることを確認

### デプロイ
- [ ] developブランチにマージ済み
- [ ] CIが成功している
- [ ] 手動動作確認が完了している
- [ ] Scheduled Jobが正常に動作することを確認

## 🔗 Related Issues
- Depends on: #23 (FR-001: 銀行連携), #24 (FR-002: カード連携), #25 (FR-003: 証券連携)
- Depends on: #30 (FR-007: データ保存)
- Blocks: #37 (FR-008: カテゴリ分類), #45 (FR-016: 月次集計)
- Related to: #26 (FR-004: 接続確認), #27 (FR-005: エラー通知)

## 📁 関連ファイル
- \`apps/backend/src/modules/sync/domain/entities/sync-history.entity.ts\`
- \`apps/backend/src/modules/sync/domain/enums/sync-status.enum.ts\`
- \`apps/backend/src/modules/sync/domain/strategies/incremental-sync.strategy.ts\`
- \`apps/backend/src/modules/sync/application/use-cases/sync-all-transactions.use-case.ts\`
- \`apps/backend/src/modules/sync/infrastructure/jobs/scheduled-sync.job.ts\`
- \`apps/backend/src/modules/sync/infrastructure/orchestrators/sync.orchestrator.ts\`
- \`apps/backend/src/modules/sync/presentation/controllers/sync.controller.ts\`

## 📚 参考資料
- \`docs/functional-requirements/FR-001-007_data-acquisition.md\`
- \`docs/system-architecture.md\` - データ同期セクション
- \`docs/system-architecture.md\` - パフォーマンス要件

## 💡 実装のヒント
- Scheduled Job: \`@nestjs/schedule\`, \`@Cron\` デコレーター
- 並行実行: \`Promise.allSettled()\` を使用
- リトライ: \`axios-retry\` またはカスタム実装
- 進捗通知: WebSocket (\`@nestjs/websockets\`) または Server-Sent Events
- データベーストランザクション: バッチ処理で使用
"

echo "  ✅ FR-006 詳細化完了"
echo ""

echo "════════════════════════════════════════════════════════════════"
echo "✅ FR-001, FR-002, FR-006の詳細化完了！"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "残りのFR-003〜005, FR-007も順次詳細化します..."
echo ""

