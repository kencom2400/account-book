# カバレッジドキュメント管理 - 使用ガイド

このガイドでは、テストカバレッジドキュメント管理機能の使い方を説明します。

## 概要

このプロジェクトでは、モジュール別のテストカバレッジを可視化し、履歴を追跡する仕組みを提供しています。

## ドキュメント構造

```
docs/testing/
├── coverage-report.md          # 最新のカバレッジレポート
├── coverage-history.md         # カバレッジ履歴
└── module-coverage/            # モジュール別詳細
    ├── backend.md              # Backend詳細
    └── frontend.md             # Frontend詳細
```

## 基本的な使い方

### 1. カバレッジレポートの生成

プロジェクトルートで以下のコマンドを実行します：

```bash
./scripts/test/generate-coverage-report.sh
```

このスクリプトは以下を実行します：

1. Backend ユニットテストのカバレッジ収集
2. Backend E2Eテストのカバレッジ収集
3. Frontend ユニットテストのカバレッジ収集
4. Markdownレポートの生成
5. モジュール別詳細レポートの生成
6. カバレッジ履歴の初期化（初回のみ）

### 2. カバレッジ履歴の更新

既存のカバレッジデータから履歴を更新します：

```bash
./scripts/test/update-coverage-history.sh
```

**注意**: このスクリプトは既存のカバレッジファイルから読み取るため、先に`generate-coverage-report.sh`を実行しておく必要があります。

### 3. レポートの確認

生成されたレポートは以下から確認できます：

- **メインレポート**: `docs/testing/coverage-report.md`
- **Backend詳細**: `docs/testing/module-coverage/backend.md`
- **Frontend詳細**: `docs/testing/module-coverage/frontend.md`
- **カバレッジ履歴**: `docs/testing/coverage-history.md`

または、README.mdの「テストカバレッジ」セクションからリンクをたどることもできます。

### 4. HTMLレポートの確認

詳細なカバレッジ情報（ファイル別・行別）を確認するには、各モジュールで生成されるHTMLレポートを開きます：

```bash
# Backend Unit
open apps/backend/coverage/lcov-report/index.html

# Backend E2E
open apps/backend/coverage-e2e/lcov-report/index.html

# Frontend Unit
open apps/frontend/coverage/lcov-report/index.html
```

## ワークフロー例

### PRマージ前の推奨ワークフロー

1. **テストとカバレッジの実行**

   ```bash
   # Backendユニットテスト
   cd apps/backend
   pnpm test:cov

   # Backend E2Eテスト
   pnpm test:e2e:cov

   # Frontendユニットテスト
   cd ../frontend
   pnpm test -- --coverage
   ```

2. **カバレッジレポートの生成**

   ```bash
   cd ../..
   ./scripts/test/generate-coverage-report.sh
   ```

3. **カバレッジの確認**
   - 生成されたMarkdownレポートを確認
   - カバレッジが目標（80%以上）を満たしているか確認
   - カバレッジが低下していないか確認

4. **履歴の更新（オプション）**

   ```bash
   ./scripts/test/update-coverage-history.sh
   ```

5. **コミット**
   ```bash
   git add docs/testing/
   git commit -m "docs: update coverage reports"
   ```

### 定期的なカバレッジチェック

週次または隔週で以下を実行することを推奨します：

```bash
# 1. カバレッジレポートを生成
./scripts/test/generate-coverage-report.sh

# 2. 履歴を更新
./scripts/test/update-coverage-history.sh

# 3. トレンドを確認
# docs/testing/coverage-history.md を開いて推移を確認
```

## 個別モジュールのカバレッジ確認

各モジュールで個別にカバレッジを確認することもできます。

### Backend

```bash
cd apps/backend

# ユニットテスト
pnpm test:cov

# E2Eテスト
pnpm test:e2e:cov

# HTMLレポートを開く
open coverage/lcov-report/index.html
open coverage-e2e/lcov-report/index.html
```

### Frontend

```bash
cd apps/frontend

# ユニットテスト
pnpm test -- --coverage

# HTMLレポートを開く
open coverage/lcov-report/index.html

# E2Eテスト（カバレッジなし）
pnpm test:e2e
pnpm test:e2e:report
```

## カバレッジ改善のヒント

### 未カバー箇所の特定

1. HTMLレポートで赤く表示された行が未カバー
2. lcov-reportのインデックスページで、カバレッジが低いファイルを特定
3. 優先度の高い順にテストを追加

### テスト追加の優先順位

1. **Critical Path（最優先）**
   - ビジネスロジックの中核部分
   - データ変換や計算ロジック
   - 重要なバリデーション

2. **エラーハンドリング（次点）**
   - 例外処理
   - エラーケース
   - 境界値テスト

3. **Integration（最後）**
   - モジュール間連携
   - 外部依存との統合

### カバレッジ目標

- **プロジェクト全体**: 80%以上
- **各モジュール**: 80%以上
- **新規コード**: 80%以上（PRごと）

### よくある問題と対処法

#### 問題1: カバレッジが突然低下した

**原因**: 新しいコードにテストが含まれていない

**対処法**:

1. 最近のコミットを確認
2. 追加されたコードにテストを追加
3. カバレッジを再確認

#### 問題2: カバレッジファイルが見つからない

**原因**: テストが実行されていない

**対処法**:

```bash
# 各モジュールでカバレッジ付きテストを実行
cd apps/backend
pnpm test:cov
pnpm test:e2e:cov

cd ../frontend
pnpm test -- --coverage
```

#### 問題3: E2Eテストのカバレッジが取れない

**原因**: E2E環境のセットアップ不足

**対処法**:

```bash
# MySQL E2E環境を起動
./scripts/dev/start-database.sh e2e

# E2Eテストを実行
cd apps/backend
pnpm test:e2e:cov
```

## スクリプトのオプション

### generate-coverage-report.sh

このスクリプトにはオプションはありません。すべてのモジュールのカバレッジを収集して、レポートを生成します。

### update-coverage-history.sh

このスクリプトにはオプションはありません。既存のカバレッジデータから履歴を更新します。

## トラブルシューティング

### Voltaが見つからない

**エラー**: `volta: command not found` または `pnpm: command not found`

**対処法**:

```bash
# Voltaをインストール
curl https://get.volta.sh | bash

# シェルを再起動してPATHを反映
exec $SHELL

# プロジェクトでVoltaを設定
cd /path/to/account-book
volta install node@24.11.1
volta install pnpm@8.15.0
```

詳細はREADME.mdを参照してください。

### jqコマンドが見つからない

**エラー**: `jq: command not found`

**対処法**:

```bash
# macOS
brew install jq

# Linux
sudo apt-get install jq
```

### カバレッジデータが0%

**原因**: カバレッジファイルが存在しない、または古い

**対処法**:

```bash
# 各モジュールでカバレッジを再生成
cd apps/backend
pnpm test:cov

cd ../frontend
pnpm test -- --coverage

# レポートを再生成
cd ../..
./scripts/test/generate-coverage-report.sh
```

## 参考資料

- [Jest Coverage Configuration](https://jestjs.io/docs/configuration#collectcoverage-boolean)
- [Istanbul Coverage Reports](https://istanbul.js.org/)
- [Codecov Documentation](https://docs.codecov.com/)
- [プロジェクトのテスト設計ドキュメント](./test-design.md)

## 今後の改善予定

- [ ] GitHub Actionsとの統合（自動レポート生成）
- [ ] PRコメントへのカバレッジサマリー投稿
- [ ] カバレッジ低下時の警告
- [ ] カバレッジバッジの生成
- [ ] モジュール別のカバレッジトレンドグラフ
