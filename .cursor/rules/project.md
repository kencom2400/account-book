# Account Book - 資産管理アプリ開発ガイドライン

## プロジェクト概要

金融機関APIを使用した個人資産管理アプリケーション。取引履歴の自動取得、カテゴリ分類、月次集計機能を提供する。

## 技術スタック

### モノレポ構成

- `apps/frontend`: Next.js（フロントエンド）
- `apps/backend`: NestJS（バックエンド）
- `libs/types`: 共通型定義（TypeScript）

### 環境管理

- env環境を使用し、プロジェクト内で完結した言語環境を構築
- パッケージマネージャー: pnpm推奨（モノレポ構成のため）

## アーキテクチャ原則

### Onion Architecture（オニオンアーキテクチャ）

レイヤを明確に分離し、依存関係を内側に向けることで拡張性と保守性を確保する。

**依存関係は常に内側に向かいます：**

- **Presentation Layer** は Application Layer に依存
- **Infrastructure Layer** は Application Layer に依存
- **Application Layer** は Domain Layer に依存
- **Domain Layer** は外部に依存しない（最内層）

#### レイヤ構成

1. **Domain Layer**: エンティティ、ドメインロジック、ドメインサービス
2. **Application Layer**: ユースケース、アプリケーションサービス
3. **Infrastructure Layer**: 外部API接続、データ永続化（JSON/DB）
4. **Presentation Layer**: コントローラー、API、UI

#### ディレクトリ構造（backend）

```
apps/backend/src/
├── domain/           # ドメイン層
│   ├── entities/
│   ├── value-objects/
│   └── repositories/ # インターフェース定義
├── application/      # アプリケーション層
│   ├── use-cases/
│   └── services/
├── infrastructure/   # インフラ層
│   ├── api/         # 金融機関API接続
│   ├── persistence/ # JSON/DB永続化
│   └── repositories/ # リポジトリ実装
└── presentation/     # プレゼンテーション層
    └── controllers/
```

## データモデル

### 取引カテゴリ

5つの基本分類を必ず守る：

1. **収入**: 資産増加（給与、賞与、配当など）
2. **支出**: 資産減少（生活費、娯楽費など）
3. **振替**: 資産間移動（銀行→証券、クレカ引き落としなど）
4. **返済**: ローン・借入の返済
5. **投資**: 投資商品の購入・売却

### クレジットカード管理

- 支出計上: カード明細取得時に「支出」として記録
- 引き落とし: 銀行引き落としは「振替」として記録
- 月次突合: カード支払い額と銀行引き落とし額を比較
- ステータス管理: 未支払い/支払済を明確に区別

### データ永続化

- 初期: JSON形式で保存
- 将来: SQLiteまたはRDBMSへの移行を想定した設計

## コーディング規約

### TypeScript

- 厳格な型定義を使用（`strict: true`）
- 共通型は`libs/types`に集約
- any型の使用を避け、unknown型を活用
- nullableな値は明示的に型定義

### ネーミング規則

- **エンティティ**: PascalCase（例: `Transaction`, `Account`）
- **ユースケース**: 動詞 + 名詞（例: `FetchTransactionHistory`, `CalculateMonthlyBalance`）
- **リポジトリ**: 名詞 + Repository（例: `TransactionRepository`）
- **API接続**: 金融機関名 + ApiClient（例: `BankApiClient`, `CardApiClient`）

### ファイル構成

- 1ファイル1クラス/1機能
- テストファイルは対象ファイルと同じディレクトリに配置（`.spec.ts`）
- バレルファイル（`index.ts`）でエクスポートを整理

## 機能要件

### 金融機関API連携

- 各金融機関の接続設定をUI上で管理
- アプリ起動時にバックグラウンドで接続確認
- 接続失敗時はポップアップで通知
- APIクライアントは抽象化し、金融機関ごとに実装を切り替え可能に

### 分類・カテゴリ

- MoneyTree、MoneyForwardの分類を参考
- ユーザーによる分類の手動修正を可能に
- デフォルト分類ルールの学習機能（将来実装）

### 集計機能

- 月次集計: 金融機関別、分類別
- 期間指定での集計
- グラフ・チャートでの可視化

## セキュリティ

- 金融機関の認証情報は環境変数で管理
- APIキー、パスワードはGitにコミットしない
- 通信は必ずHTTPSを使用
- データは暗号化して保存（将来対応）

## テスト戦略

- ユニットテスト: 各レイヤごとに実装
- 統合テスト: API連携部分
- E2Eテスト: 重要なユーザーフロー
- テストカバレッジ: 80%以上を目標

## コミットメッセージ

コミットメッセージの規約については、[Commit Rules](./commit.md) を参照してください。

## 注意事項

- 金融データの取り扱いには細心の注意を払う
- パフォーマンスを考慮し、大量データの処理は非同期で実装
- エラーハンドリングは必ず実装し、ユーザーにわかりやすいメッセージを表示
- ログは詳細に記録し、トラブルシューティングを容易にする

## 推奨ライブラリ

- バリデーション: `zod` または `class-validator`
- 日付処理: `dayjs` または `date-fns`
- HTTP通信: `axios`
- 状態管理（frontend）: `zustand` または `jotai`
- UIコンポーネント: `shadcn/ui` または `Chakra UI`

## Issue管理

### Issue作成時のルール

- **Issue作成時は必ずGitHub Projectsに追加する**
  - プロジェクト名: `Account Book Development`
  - コマンド例: `gh project item-add 1 --owner kencom2400 --url <issue_url>`
- 適切なラベルを付与する（bug、feature、enhancement等）
- テンプレートに従って詳細を記載する
- 関連するissueやPRがあれば明記する

### Issue管理のベストプラクティス

- 1つのissueは1つの問題または機能に集中させる
- ただし、複数の関連する問題が同じ原因の場合はまとめて記載可能
- 優先度や影響範囲を明確に記載する
- 実装方針や修正方針を具体的に記述する

## 開発フロー

1. 要件定義 → ドメインモデル設計
2. ドメイン層から実装開始（内側→外側）
3. ユースケース実装
4. インフラ層実装（API接続、データ永続化）
5. プレゼンテーション層実装
6. テスト実装
7. レビュー・リファクタリング
