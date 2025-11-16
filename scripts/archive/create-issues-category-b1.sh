#!/bin/bash

# GitHub Issue一括作成スクリプト（カテゴリB: 機能要件実装 - Part 1）
# FR-001〜FR-007: データ取得機能

set -e

REPO="kencom2400/account-book"
echo "════════════════════════════════════════════════════════════════"
echo "   📋 カテゴリB-1: データ取得機能 (FR-001〜007)"
echo "════════════════════════════════════════════════════════════════"
echo ""

# FR-001
echo "[1/7] FR-001: 銀行口座との連携機能"
gh issue create \
  --repo "$REPO" \
  --title "[FEATURE] FR-001: 銀行口座との連携機能" \
  --label "feature,integration,bank,backend,priority: high,size: XL" \
  --milestone "Phase 1: データ取得" \
  --body "## 📋 機能概要
銀行API連携による口座情報・取引履歴の自動取得機能

## 🎯 ユーザーストーリー
口座管理者として、銀行口座と連携して取引履歴を自動取得したい

## 📦 実装内容
### Backend
- [ ] 銀行API認証モジュールの実装
- [ ] OAuth2/API Keyベースの認証フロー
- [ ] 口座情報取得API実装
- [ ] 取引履歴取得API実装
- [ ] エラーハンドリング・リトライ機能

### Domain層
- [ ] Institution Entity (金融機関)
- [ ] BankAccount Entity (銀行口座)
- [ ] Transaction Entity (取引)

### Infrastructure層  
- [ ] BankAPIClient実装
- [ ] 認証情報の暗号化保存

## ✅ 受入基準
- [ ] 銀行APIに正常に接続できる
- [ ] OAuth認証が正常に動作する
- [ ] 口座情報が取得できる
- [ ] 取引履歴が取得できる
- [ ] エラー時に適切なメッセージを返す

## 🔗 関連Issue
- FR-004: 接続確認
- FR-005: エラー通知
- FR-006: 取引履歴取得

## 📚 参考
- \`docs/functional-requirements/FR-001-007_data-acquisition.md\`
- \`docs/system-architecture.md\` - 外部API連携"

echo "  ✅ 作成成功"
echo ""

# FR-002
echo "[2/7] FR-002: クレジットカードとの連携機能"
gh issue create \
  --repo "$REPO" \
  --title "[FEATURE] FR-002: クレジットカードとの連携機能" \
  --label "feature,integration,credit-card,backend,priority: high,size: XL" \
  --milestone "Phase 1: データ取得" \
  --body "## 📋 機能概要
クレジットカードAPI連携による利用明細の自動取得機能

## 🎯 ユーザーストーリー
カード利用者として、クレジットカードと連携して利用明細を自動取得したい

## 📦 実装内容
### Backend
- [ ] クレジットカードAPI認証モジュール
- [ ] カード情報取得API実装
- [ ] 利用明細取得API実装
- [ ] 請求額情報の取得
- [ ] 支払期日管理

### Domain層
- [ ] CreditCard Entity
- [ ] CreditCardTransaction Entity
- [ ] Payment Entity

### Infrastructure層
- [ ] CreditCardAPIClient実装
- [ ] カード情報の暗号化保存

## ✅ 受入基準
- [ ] カードAPIに正常に接続できる
- [ ] 利用明細が取得できる
- [ ] 請求額と支払期日が取得できる
- [ ] 複数カードに対応
- [ ] エラー時に適切なメッセージを返す

## 🔗 関連Issue
- FR-012〜015: クレジットカード管理
- FR-006: 取引履歴取得

## 📚 参考
- \`docs/functional-requirements/FR-001-007_data-acquisition.md\`"

echo "  ✅ 作成成功"
echo ""

# FR-003
echo "[3/7] FR-003: 証券会社との連携機能"
gh issue create \
  --repo "$REPO" \
  --title "[FEATURE] FR-003: 証券会社との連携機能" \
  --label "feature,integration,backend,priority: medium,size: L" \
  --milestone "Phase 1: データ取得" \
  --body "## 📋 機能概要
証券会社API連携による口座情報・取引履歴の自動取得機能

## 🎯 ユーザーストーリー
投資家として、証券口座と連携して取引履歴を自動取得したい

## 📦 実装内容
### Backend
- [ ] 証券会社API認証モジュール
- [ ] 証券口座情報取得API
- [ ] 保有銘柄取得API
- [ ] 取引履歴取得API
- [ ] 時価評価額の取得

### Domain層
- [ ] SecuritiesAccount Entity
- [ ] Holding Entity (保有銘柄)
- [ ] SecurityTransaction Entity

### Infrastructure層
- [ ] SecuritiesAPIClient実装
- [ ] 証券情報の暗号化保存

## ✅ 受入基準
- [ ] 証券APIに正常に接続できる
- [ ] 口座情報が取得できる
- [ ] 保有銘柄と評価額が取得できる
- [ ] 取引履歴が取得できる
- [ ] 複数口座に対応

## 🔗 関連Issue
- FR-006: 取引履歴取得

## 📚 参考
- \`docs/functional-requirements/FR-001-007_data-acquisition.md\`"

echo "  ✅ 作成成功"
echo ""

# FR-004
echo "[4/7] FR-004: アプリ起動時のバックグラウンド接続確認"
gh issue create \
  --repo "$REPO" \
  --title "[FEATURE] FR-004: アプリ起動時のバックグラウンド接続確認" \
  --label "feature,backend,priority: high,size: M" \
  --milestone "Phase 1: データ取得" \
  --body "## 📋 機能概要
アプリケーション起動時に各金融機関APIへの接続状態を確認する機能

## 🎯 ユーザーストーリー
ユーザーとして、アプリ起動時に金融機関との接続状態を自動確認したい

## 📦 実装内容
### Backend
- [ ] 起動時接続チェック機能
- [ ] 各APIの疎通確認
- [ ] 接続ステータスの管理
- [ ] タイムアウト処理
- [ ] バックグラウンド実行

### Application層
- [ ] ConnectionCheckUseCase
- [ ] ScheduledConnectionCheck (定期実行)

## ✅ 受入基準
- [ ] アプリ起動時に自動的に接続確認が実行される
- [ ] 各金融機関の接続状態が記録される
- [ ] 5秒以内に結果が返る
- [ ] バックグラウンドで実行される
- [ ] 接続状態がフロントエンドに通知される

## 🔗 関連Issue
- FR-005: 接続失敗時の通知
- FR-001〜003: API連携

## 📚 参考
- \`docs/functional-requirements/FR-001-007_data-acquisition.md\`"

echo "  ✅ 作成成功"
echo ""

# FR-005
echo "[5/7] FR-005: 接続失敗時のポップアップ通知"
gh issue create \
  --repo "$REPO" \
  --title "[FEATURE] FR-005: 接続失敗時のポップアップ通知" \
  --label "feature,frontend,priority: high,size: M" \
  --milestone "Phase 1: データ取得" \
  --body "## 📋 機能概要
金融機関API接続失敗時にユーザーへポップアップで通知する機能

## 🎯 ユーザーストーリー
ユーザーとして、API接続に失敗したときに即座に通知を受け取りたい

## 📦 実装内容
### Frontend
- [ ] エラー通知コンポーネント
- [ ] トースト/モーダル実装
- [ ] エラーメッセージ表示
- [ ] リトライボタン
- [ ] エラー詳細の表示/非表示切替

### Backend
- [ ] エラー情報のフォーマット
- [ ] エラーレベルの分類（warning/error/critical）
- [ ] 再接続API実装

## ✅ 受入基準
- [ ] 接続失敗時にポップアップが表示される
- [ ] エラーメッセージが分かりやすい
- [ ] リトライボタンで再接続できる
- [ ] エラー履歴が確認できる
- [ ] 重複通知を防止できる

## 🔗 関連Issue
- FR-004: 接続確認
- FR-001〜003: API連携

## 📚 参考
- \`docs/functional-requirements/FR-001-007_data-acquisition.md\`"

echo "  ✅ 作成成功"
echo ""

# FR-006
echo "[6/7] FR-006: 各金融機関から利用履歴を自動取得"
gh issue create \
  --repo "$REPO" \
  --title "[FEATURE] FR-006: 各金融機関から利用履歴を自動取得" \
  --label "feature,backend,sync,priority: high,size: XL" \
  --milestone "Phase 1: データ取得" \
  --body "## 📋 機能概要
各金融機関APIから取引履歴を自動的に取得し、データベースに保存する機能

## 🎯 ユーザーストーリー
ユーザーとして、手動操作なしで取引履歴を自動的に取得したい

## 📦 実装内容
### Backend
- [ ] 自動同期スケジューラ実装
- [ ] 取引履歴取得API
- [ ] 差分同期機能
- [ ] バッチ処理実装
- [ ] 同期ステータス管理
- [ ] エラーリトライ機能

### Application層
- [ ] SyncTransactionsUseCase
- [ ] ScheduledSyncJob (定期実行)
- [ ] IncrementalSyncStrategy (差分同期)

### Domain層
- [ ] SyncHistory Entity
- [ ] SyncStatus Enum

## ✅ 受入基準
- [ ] 1日1回自動的に同期される
- [ ] 手動同期もできる
- [ ] 差分のみ取得される（重複防止）
- [ ] 同期状況が確認できる
- [ ] エラー時は自動リトライされる

## 🔗 関連Issue
- FR-001〜003: API連携
- FR-007: データ保存
- FR-004: 接続確認

## 📚 参考
- \`docs/functional-requirements/FR-001-007_data-acquisition.md\`
- \`docs/system-architecture.md\` - 同期戦略"

echo "  ✅ 作成成功"
echo ""

# FR-007
echo "[7/7] FR-007: 取得データのローカル保存（JSON形式）"
gh issue create \
  --repo "$REPO" \
  --title "[FEATURE] FR-007: 取得データのローカル保存（JSON形式）" \
  --label "feature,backend,data,priority: high,size: M" \
  --milestone "Phase 1: データ取得" \
  --body "## 📋 機能概要
取得した取引履歴をJSON形式でローカルに保存する機能

## 🎯 ユーザーストーリー
システムとして、取得したデータを永続化し、後から参照できるようにしたい

## 📦 実装内容
### Infrastructure層
- [ ] JSONファイル保存処理
- [ ] ファイル命名規則の実装
- [ ] ディレクトリ構造の管理
- [ ] バックアップ機能
- [ ] データ圧縮

### Repository実装
- [ ] FileSystemTransactionRepository
- [ ] FileSystemInstitutionRepository
- [ ] ファイルロック機能
- [ ] 同時書き込み制御

### 保存形式
\`\`\`
data/
  transactions/
    YYYY-MM/
      {institution_id}_YYYY-MM-DD.json
  institutions/
    {institution_id}.json
\`\`\`

## ✅ 受入基準
- [ ] 取得データがJSON形式で保存される
- [ ] 月別・機関別にファイル分割される
- [ ] データの読み書きが正常に動作する
- [ ] ファイル破損時のエラーハンドリング
- [ ] パフォーマンスが十分（1000件/秒以上）

## 🔗 関連Issue
- FR-006: 取引履歴取得
- A-8: データディレクトリ構造

## 📚 参考
- \`docs/functional-requirements/FR-001-007_data-acquisition.md\`
- \`docs/system-architecture.md\` - データ永続化"

echo "  ✅ 作成成功"
echo ""

echo "════════════════════════════════════════════════════════════════"
echo "✅ カテゴリB-1 Issue作成完了！ (7個)"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "確認: https://github.com/kencom2400/account-book/issues"
echo ""

