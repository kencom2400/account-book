#!/bin/bash

# カテゴリC〜H: 残り全Issue一括作成

set -e

REPO="kencom2400/account-book"

echo "════════════════════════════════════════════════════════════════"
echo "   📋 カテゴリC〜H: 残りIssue一括作成"
echo "════════════════════════════════════════════════════════════════"
echo ""

# カテゴリC: 非機能要件 (簡潔版)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 カテゴリC: 非機能要件 (14個)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

gh issue create --repo "$REPO" --title "[TASK] C-1: 認証情報の暗号化保存" --label "task,security,backend,priority: high,size: M" --body "金融機関のAPI認証情報を暗号化して保存する機能の実装"
gh issue create --repo "$REPO" --title "[TASK] C-2: HTTPS通信の実装" --label "task,security,backend,priority: high,size: S" --body "すべてのAPI通信をHTTPS化"
gh issue create --repo "$REPO" --title "[TASK] C-3: 環境変数による秘匿情報管理" --label "task,security,infrastructure,priority: high,size: S" --body ".envファイルによる秘匿情報の管理"
gh issue create --repo "$REPO" --title "[TASK] C-4: CSRF対策の実装" --label "task,security,backend,priority: medium,size: S" --body "CSRFトークンによる攻撃対策"
gh issue create --repo "$REPO" --title "[TASK] C-5: XSS対策の実装" --label "task,security,frontend,backend,priority: medium,size: S" --body "XSS攻撃対策の実装"
gh issue create --repo "$REPO" --title "[TASK] C-6: アプリ起動時間の最適化" --label "task,backend,frontend,priority: medium,size: M" --body "アプリケーション起動時間を3秒以内に最適化"
gh issue create --repo "$REPO" --title "[TASK] C-7: データ同期処理のバックグラウンド化" --label "task,backend,sync,priority: high,size: M" --body "データ同期をバックグラウンドで実行"
gh issue create --repo "$REPO" --title "[TASK] C-8: 大量データの表示パフォーマンス最適化" --label "task,frontend,priority: medium,size: M" --body "仮想スクロール等による大量データ表示の最適化"
gh issue create --repo "$REPO" --title "[TASK] C-9: オフラインモードの実装" --label "task,frontend,backend,priority: low,size: L" --body "オフライン時でもデータ閲覧可能にする機能"
gh issue create --repo "$REPO" --title "[TASK] C-10: エラーハンドリング統一化" --label "task,backend,frontend,priority: high,size: M" --body "エラーハンドリングの統一的な実装"
gh issue create --repo "$REPO" --title "[TASK] C-11: ロギング機能の実装" --label "task,backend,priority: medium,size: M" --body "アプリケーションログの記録機能"
gh issue create --repo "$REPO" --title "[TASK] C-12: レイヤー分離の徹底" --label "task,backend,refactor,priority: medium,size: L" --body "Onion Architectureに基づくレイヤー分離の徹底"
gh issue create --repo "$REPO" --title "[TASK] C-13: API仕様書の自動生成" --label "task,documentation,backend,priority: low,size: M" --body "Swaggerによる API仕様書の自動生成"
gh issue create --repo "$REPO" --title "[TASK] C-14: レスポンシブデザインの実装" --label "task,frontend,priority: medium,size: M" --body "モバイル・タブレット対応のレスポンシブデザイン"

echo "✅ カテゴリC完了 (14個)"
echo ""

# カテゴリD: テスト実装
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 カテゴリD: テスト実装 (14個)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

gh issue create --repo "$REPO" --title "[TASK] D-1: Backendユニットテスト環境構築" --label "task,testing,backend,priority: high,size: M" --body "Jest+Supertestによるバックエンドテスト環境構築"
gh issue create --repo "$REPO" --title "[TASK] D-2: Frontendユニットテスト環境構築" --label "task,testing,frontend,priority: high,size: M" --body "Jest+React Testing Libraryによるフロントエンドテスト環境構築"
gh issue create --repo "$REPO" --title "[TASK] D-3: Domain層ユニットテスト" --label "task,testing,backend,priority: high,size: L" --body "ドメインロジックのユニットテスト実装"
gh issue create --repo "$REPO" --title "[TASK] D-4: Application層ユニットテスト" --label "task,testing,backend,priority: high,size: L" --body "UseCaseのユニットテスト実装"
gh issue create --repo "$REPO" --title "[TASK] D-5: Reactコンポーネントテスト" --label "task,testing,frontend,priority: medium,size: L" --body "Reactコンポーネントのテスト実装"
gh issue create --repo "$REPO" --title "[TASK] D-6: APIエンドポイント統合テスト" --label "task,testing,backend,priority: high,size: XL" --body "APIエンドポイントの統合テスト実装"
gh issue create --repo "$REPO" --title "[TASK] D-7: Repository統合テスト" --label "task,testing,backend,priority: medium,size: M" --body "Repositoryの統合テスト実装"
gh issue create --repo "$REPO" --title "[TASK] D-8: E2Eテスト環境構築" --label "task,testing,frontend,backend,priority: medium,size: M" --body "Playwrightによ るE2Eテスト環境構築"
gh issue create --repo "$REPO" --title "[TASK] D-9: ユーザーシナリオE2Eテスト" --label "task,testing,frontend,backend,priority: medium,size: XL" --body "主要ユーザーシナリオのE2Eテスト実装"
gh issue create --repo "$REPO" --title "[TASK] D-10: テストデータファクトリ作成" --label "task,testing,backend,priority: medium,size: M" --body "テストデータを生成するファクトリの実装"
gh issue create --repo "$REPO" --title "[TASK] D-11: テストフィクスチャ整備" --label "task,testing,priority: medium,size: M" --body "各種テストフィクスチャの整備"
gh issue create --repo "$REPO" --title "[TASK] D-12: パフォーマンステスト実装" --label "task,testing,backend,priority: low,size: M" --body "API性能テストの実装"
gh issue create --repo "$REPO" --title "[TASK] D-13: セキュリティテスト実装" --label "task,testing,security,priority: medium,size: M" --body "セキュリティ脆弱性テストの実装"
gh issue create --repo "$REPO" --title "[TASK] D-14: テストカバレッジ80%達成" --label "task,testing,priority: high,size: L" --body "全体的なテストカバレッジ80%以上を達成"

echo "✅ カテゴリD完了 (14個)"
echo ""

# カテゴリE: UI/UX実装
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 カテゴリE: UI/UX実装 (15個)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

gh issue create --repo "$REPO" --title "[TASK] E-1: ダッシュボード画面の実装" --label "task,frontend,priority: high,size: L" --body "メインダッシュボード画面のUI実装"
gh issue create --repo "$REPO" --title "[TASK] E-2: 取引履歴一覧画面の実装" --label "task,frontend,priority: high,size: M" --body "取引履歴一覧表示画面のUI実装"
gh issue create --repo "$REPO" --title "[TASK] E-3: 取引詳細画面の実装" --label "task,frontend,priority: medium,size: M" --body "取引詳細表示画面のUI実装"
gh issue create --repo "$REPO" --title "[TASK] E-4: 費目編集画面の実装" --label "task,frontend,priority: medium,size: M" --body "費目編集・設定画面のUI実装"
gh issue create --repo "$REPO" --title "[TASK] E-5: 月次レポート画面の実装" --label "task,frontend,priority: high,size: L" --body "月次収支レポート画面のUI実装"
gh issue create --repo "$REPO" --title "[TASK] E-6: 年次レポート画面の実装" --label "task,frontend,priority: medium,size: L" --body "年次収支レポート画面のUI実装"
gh issue create --repo "$REPO" --title "[TASK] E-7: クレジットカード管理画面の実装" --label "task,frontend,priority: high,size: M" --body "クレジットカード管理画面のUI実装"
gh issue create --repo "$REPO" --title "[TASK] E-8: 金融機関設定画面の実装" --label "task,frontend,priority: high,size: M" --body "金融機関登録・設定画面のUI実装"
gh issue create --repo "$REPO" --title "[TASK] E-9: 同期設定画面の実装" --label "task,frontend,priority: medium,size: S" --body "データ同期設定画面のUI実装"
gh issue create --repo "$REPO" --title "[TASK] E-10: グラフコンポーネントの実装" --label "task,frontend,chart,priority: high,size: L" --body "各種グラフ表示コンポーネントの実装"
gh issue create --repo "$REPO" --title "[TASK] E-11: 共通UIコンポーネントライブラリ構築" --label "task,frontend,library,priority: medium,size: M" --body "Button、Card、Modal等の共通コンポーネント"
gh issue create --repo "$REPO" --title "[TASK] E-12: ローディング・スケルトンUI実装" --label "task,frontend,priority: medium,size: S" --body "ローディング中のスケルトンUI実装"
gh issue create --repo "$REPO" --title "[TASK] E-13: エラー表示UI実装" --label "task,frontend,priority: medium,size: S" --body "エラーメッセージ表示UI実装"
gh issue create --repo "$REPO" --title "[TASK] E-14: ダークモードの実装" --label "task,frontend,priority: low,size: M" --body "ダークモード切替機能の実装"
gh issue create --repo "$REPO" --title "[TASK] E-15: アクセシビリティ対応" --label "task,frontend,priority: low,size: M" --body "WCAG 2.1準拠のアクセシビリティ対応"

echo "✅ カテゴリE完了 (15個)"
echo ""

# カテゴリF: データベース移行
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 カテゴリF: データベース移行 (5個)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

gh issue create --repo "$REPO" --title "[TASK] F-1: TypeORMセットアップ" --label "task,database,backend,priority: low,size: M" --body "TypeORMの導入とセットアップ"
gh issue create --repo "$REPO" --title "[TASK] F-2: データベーススキーマ設計" --label "task,database,backend,priority: low,size: L" --body "RDBMSのスキーマ設計"
gh issue create --repo "$REPO" --title "[TASK] F-3: マイグレーションスクリプト作成" --label "task,database,backend,priority: low,size: M" --body "JSONからDBへのマイグレーションスクリプト"
gh issue create --repo "$REPO" --title "[TASK] F-4: Repository実装のDB対応" --label "task,database,backend,priority: low,size: L" --body "RepositoryをDB対応に書き換え"
gh issue create --repo "$REPO" --title "[TASK] F-5: パフォーマンステストとチューニング" --label "task,database,backend,priority: low,size: M" --body "DB性能テストと最適化"

echo "✅ カテゴリF完了 (5個)"
echo ""

# カテゴリG: ドキュメント・保守
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 カテゴリG: ドキュメント・保守 (7個)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

gh issue create --repo "$REPO" --title "[TASK] G-1: API仕様書の整備" --label "task,documentation,backend,priority: medium,size: M" --body "APIエンドポイントの仕様書整備"
gh issue create --repo "$REPO" --title "[TASK] G-2: コンポーネント仕様書の整備" --label "task,documentation,frontend,priority: low,size: M" --body "Reactコンポーネントの仕様書整備"
gh issue create --repo "$REPO" --title "[TASK] G-3: デプロイ手順書の作成" --label "task,documentation,infrastructure,priority: medium,size: S" --body "本番デプロイ手順のドキュメント作成"
gh issue create --repo "$REPO" --title "[TASK] G-4: トラブルシューティングガイド作成" --label "task,documentation,priority: low,size: M" --body "よくある問題と解決方法のガイド"
gh issue create --repo "$REPO" --title "[TASK] G-5: 運用監視の仕組み構築" --label "task,infrastructure,priority: low,size: M" --body "ログ監視・アラート通知の仕組み構築"
gh issue create --repo "$REPO" --title "[TASK] G-6: バックアップ・リストア手順整備" --label "task,infrastructure,priority: medium,size: M" --body "データバックアップとリストア手順の整備"
gh issue create --repo "$REPO" --title "[TASK] G-7: READMEの最終更新" --label "task,documentation,priority: medium,size: S" --body "プロジェクトREADMEの最終更新"

echo "✅ カテゴリG完了 (7個)"
echo ""

# カテゴリH: 拡張機能
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 カテゴリH: 拡張機能 (4個)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

gh issue create --repo "$REPO" --title "[ENHANCEMENT] H-1: 予算設定機能" --label "enhancement,frontend,backend,priority: low,size: L" --body "カテゴリ別の予算設定と超過アラート機能"
gh issue create --repo "$REPO" --title "[ENHANCEMENT] H-2: AIによる支出予測機能" --label "enhancement,backend,priority: low,size: XL" --body "機械学習による今後の支出予測機能"
gh issue create --repo "$REPO" --title "[ENHANCEMENT] H-3: レシート自動読取機能" --label "enhancement,frontend,backend,priority: low,size: XL" --body "OCRによるレシート自動読取・登録機能"
gh issue create --repo "$REPO" --title "[ENHANCEMENT] H-4: マルチユーザー対応" --label "enhancement,backend,frontend,priority: low,size: XL" --body "複数ユーザーアカウント・権限管理機能"

echo "✅ カテゴリH完了 (4個)"
echo ""

echo "════════════════════════════════════════════════════════════════"
echo "✅ 全Issue作成完了！"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "作成されたIssue: 59個（カテゴリC〜H）"
echo "合計: 100個のIssue"
echo ""
echo "🔗 Issue一覧:"
echo "   https://github.com/kencom2400/account-book/issues"
echo ""
echo "📊 プロジェクトボード:"
echo "   https://github.com/users/kencom2400/projects/1"
echo ""
echo "════════════════════════════════════════════════════════════════"

