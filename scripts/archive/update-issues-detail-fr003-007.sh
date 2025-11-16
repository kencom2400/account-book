#!/bin/bash

# Issue詳細化スクリプト: FR-003〜007（残り）

set -e

REPO="kencom2400/account-book"

echo "════════════════════════════════════════════════════════════════"
echo "   📝 Issue詳細化: FR-003〜007（残り）"
echo "════════════════════════════════════════════════════════════════"
echo ""

# FR-003
echo "[1/4] FR-003を詳細化中..."
gh issue edit 25 --repo "$REPO" --body "## 📋 概要
証券会社API連携による口座情報・取引履歴の自動取得機能

## 🎯 ユーザーストーリー
投資家として、証券口座と連携して取引履歴と保有銘柄を自動取得し、資産全体を一元管理したい

## 📦 実装内容

### Backend - Domain層
- [ ] SecuritiesAccount Entity の実装
- [ ] Holding Entity（保有銘柄）の実装
- [ ] SecurityTransaction Entity の実装
- [ ] Portfolio Value Object の実装

### Backend - Application層
- [ ] ConnectSecuritiesAccountUseCase の実装
- [ ] FetchHoldingsUseCase の実装
- [ ] FetchSecurityTransactionsUseCase の実装
- [ ] CalculatePortfolioValueUseCase の実装

### Backend - Infrastructure層
- [ ] SecuritiesAPIClient の実装
- [ ] 認証フローの実装
- [ ] 時価評価額取得の実装

### Backend - Presentation層
- [ ] POST /api/institutions/securities/connect エンドポイント
- [ ] GET /api/institutions/securities/:id/holdings エンドポイント
- [ ] GET /api/institutions/securities/:id/transactions エンドポイント

## ✅ Acceptance Criteria（受入基準）
- [ ] 証券会社APIに正常に接続できる
- [ ] 口座情報が取得できる
- [ ] 保有銘柄一覧と評価額が取得できる
- [ ] 取引履歴（買付・売却）が取得できる
- [ ] 時価評価額が正しく計算される
- [ ] 複数の証券口座に対応できる

## 📋 Definition of Done（完了定義）
- [ ] 実装が完了している
- [ ] コードレビューが完了している
- [ ] ユニットテストが書かれている（カバレッジ85%以上）
- [ ] 統合テストが書かれている
- [ ] すべてのテストがパスしている
- [ ] API仕様書が更新されている
- [ ] マージ済み、CIが成功している

## 🔗 Related Issues
- Depends on: #23 (FR-001: 銀行連携)
- Related to: #29 (FR-006: 取引履歴自動取得)

## 📁 関連ファイル
- \`apps/backend/src/modules/securities/\`

## 📚 参考資料
- \`docs/functional-requirements/FR-001-007_data-acquisition.md\`
"

echo "  ✅ FR-003 詳細化完了"

# FR-004
echo "[2/4] FR-004を詳細化中..."
gh issue edit 26 --repo "$REPO" --body "## 📋 概要
アプリケーション起動時に各金融機関APIへの接続状態を確認する機能

## 🎯 ユーザーストーリー
ユーザーとして、アプリ起動時に金融機関との接続状態を自動確認し、問題があれば即座に把握したい

## 📦 実装内容

### Backend - Application層
- [ ] CheckConnectionStatusUseCase の実装
- [ ] ScheduledConnectionCheckUseCase の実装
- [ ] GetConnectionHistoryUseCase の実装

### Backend - Infrastructure層
- [ ] ConnectionChecker Service の実装
- [ ] ヘルスチェックエンドポイント呼び出し
- [ ] タイムアウト処理の実装
- [ ] 接続履歴の記録

### Backend - Presentation層
- [ ] GET /api/health/institutions エンドポイント
- [ ] GET /api/health/institutions/:id エンドポイント

## ✅ Acceptance Criteria（受入基準）
- [ ] アプリ起動時に自動的に接続確認が実行される
- [ ] 各金融機関の接続状態（OK/NG）が取得できる
- [ ] 5秒以内に結果が返る
- [ ] バックグラウンドで実行される（UIをブロックしない）
- [ ] 接続履歴が記録される
- [ ] 定期的に接続確認が実行される（1時間ごと）

## 📋 Definition of Done（完了定義）
- [ ] 実装が完了している
- [ ] コードレビューが完了している
- [ ] ユニットテストが書かれている（カバレッジ85%以上）
- [ ] パフォーマンステスト（5秒以内）が確認されている
- [ ] すべてのテストがパスしている
- [ ] API仕様書が更新されている
- [ ] マージ済み、CIが成功している

## 🔗 Related Issues
- Depends on: #23 (FR-001), #24 (FR-002), #25 (FR-003)
- Blocks: #27 (FR-005: エラー通知)

## 📁 関連ファイル
- \`apps/backend/src/modules/health/\`

## 📚 参考資料
- \`docs/functional-requirements/FR-001-007_data-acquisition.md\`
"

echo "  ✅ FR-004 詳細化完了"

# FR-005
echo "[3/4] FR-005を詳細化中..."
gh issue edit 27 --repo "$REPO" --body "## 📋 概要
金融機関API接続失敗時にユーザーへポップアップで通知する機能

## 🎯 ユーザーストーリー
ユーザーとして、API接続に失敗したときに即座に通知を受け取り、適切に対処したい

## 📦 実装内容

### Frontend
- [ ] エラー通知コンポーネントの実装
- [ ] Toast通知の実装
- [ ] モーダルダイアログの実装
- [ ] エラーメッセージ表示の実装
- [ ] リトライボタンの実装
- [ ] エラー詳細の表示/非表示切替

### Backend
- [ ] エラー情報のフォーマット
- [ ] エラーレベルの分類（warning/error/critical）
- [ ] POST /api/institutions/:id/retry エンドポイント

### State Management
- [ ] エラー通知用のStore実装（Zustand）
- [ ] 重複通知の防止ロジック

## ✅ Acceptance Criteria（受入基準）
- [ ] 接続失敗時にポップアップが表示される
- [ ] エラーメッセージが分かりやすい日本語で表示される
- [ ] リトライボタンをクリックすると再接続が試みられる
- [ ] エラー履歴が確認できる
- [ ] 重複通知が防止される
- [ ] エラーレベルに応じて色分けされる（warning: 黄、error: 赤）
- [ ] 5秒後に自動的に閉じる（手動でも閉じられる）

## 📋 Definition of Done（完了定義）
- [ ] 実装が完了している
- [ ] コードレビューが完了している
- [ ] Reactコンポーネントテストが書かれている
- [ ] E2Eテストが書かれている（エラー通知の表示確認）
- [ ] すべてのテストがパスしている
- [ ] UIが美しい（デザインレビュー完了）
- [ ] アクセシビリティ対応（ARIA属性）
- [ ] マージ済み、CIが成功している

## 🔗 Related Issues
- Depends on: #26 (FR-004: 接続確認)
- Related to: #23 (FR-001), #24 (FR-002), #25 (FR-003)

## 📁 関連ファイル
- \`apps/frontend/src/components/notifications/ErrorToast.tsx\`
- \`apps/frontend/src/components/notifications/ErrorModal.tsx\`
- \`apps/frontend/src/stores/notification.store.ts\`

## 📚 参考資料
- \`docs/functional-requirements/FR-001-007_data-acquisition.md\`

## 💡 実装のヒント
- Toast UI: \`react-hot-toast\` または \`@chakra-ui/react\` の Toast
- Modal: \`@chakra-ui/modal\` または自作
"

echo "  ✅ FR-005 詳細化完了"

# FR-007
echo "[4/4] FR-007を詳細化中..."
gh issue edit 30 --repo "$REPO" --body "## 📋 概要
取得した取引履歴をJSON形式でローカルに保存する機能

## 🎯 ユーザーストーリー
システムとして、取得したデータを永続化し、後から高速に参照できるようにしたい

## 📦 実装内容

### Backend - Infrastructure層
- [ ] FileSystemTransactionRepository の実装
- [ ] FileSystemInstitutionRepository の実装
- [ ] ファイル命名規則の実装
- [ ] ディレクトリ構造の管理
- [ ] ファイル書き込み処理
- [ ] ファイル読み込み処理
- [ ] ファイルロック機能
- [ ] 同時書き込み制御
- [ ] データバックアップ機能
- [ ] データ圧縮（オプション）

### データ構造
\`\`\`
data/
  transactions/
    YYYY-MM/
      bank_{institution_id}_YYYY-MM-DD.json
      card_{institution_id}_YYYY-MM-DD.json
  institutions/
    {institution_id}.json
  sync-history/
    YYYY-MM-DD.json
\`\`\`

## ✅ Acceptance Criteria（受入基準）
- [ ] 取得データがJSON形式で保存される
- [ ] 月別・機関別にファイルが分割される
- [ ] データの読み書きが正常に動作する
- [ ] ファイル破損時のエラーハンドリングが適切
- [ ] パフォーマンスが十分（1000件/秒以上の書き込み）
- [ ] 並行書き込みが制御される（ファイルロック）
- [ ] ファイルが存在しない場合は自動作成される
- [ ] データフォーマットが統一されている（JSON Schema準拠）
- [ ] ファイルサイズが適切（1ファイル10MB以下）

## 📋 Definition of Done（完了定義）
- [ ] 実装が完了している
- [ ] コードレビューが完了している
- [ ] ユニットテストが書かれている（カバレッジ90%以上）
- [ ] 統合テストが書かれている
- [ ] パフォーマンステストが書かれている（1000件/秒）
- [ ] ファイルロックのテストが書かれている
- [ ] すべてのテストがパスしている
- [ ] ドキュメントが更新されている（ファイル構造）
- [ ] マージ済み、CIが成功している

## 🔗 Related Issues
- Depends on: #29 (FR-006: 取引履歴取得)
- Blocks: #37 (FR-008: カテゴリ分類)
- Related to: #12 (A-8: データディレクトリ構造)

## 📁 関連ファイル
- \`apps/backend/src/modules/transaction/infrastructure/repositories/file-system-transaction.repository.ts\`
- \`apps/backend/src/modules/institution/infrastructure/repositories/file-system-institution.repository.ts\`
- \`apps/backend/src/common/utils/file-lock.util.ts\`
- \`data/\` (データディレクトリ)

## 📚 参考資料
- \`docs/functional-requirements/FR-001-007_data-acquisition.md\`
- \`docs/system-architecture.md\` - データ永続化セクション

## 💡 実装のヒント
- ファイル操作: \`fs-extra\` パッケージ
- ファイルロック: \`proper-lockfile\` パッケージ
- JSON Schema: \`ajv\` パッケージ（バリデーション）
- 圧縮: \`zlib\` (Node.js標準)
"

echo "  ✅ FR-007 詳細化完了"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ FR-003〜007の詳細化完了！"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "これでFR-001〜007（データ取得機能）の詳細化が完了しました"
echo ""

