# 金融機関別資産残高表示機能 (FR-026) モジュール詳細設計書

**対象機能**:

- FR-026: 金融機関別資産残高表示

**作成日**: 2025-01-27
**最終更新日**: 2025-01-27
**バージョン**: 1.0

## 概要

このドキュメントは、金融機関別資産残高表示機能 (FR-026) に関するモジュールの詳細設計を文書化したものです。

**簡単な機能説明**: 各金融機関の現在残高を集計し、総資産や機関別の構成比を視覚化する。総資産カード、金融機関別リスト、資産構成グラフ（横棒グラフ）を表示する。前月比の増減も表示する。

## 目次

1. [クラス図](./class-diagrams.md) - **必須**
2. [シーケンス図](./sequence-diagrams.md) - **必須**
3. [入出力設計](./input-output-design.md) - **必須** (API仕様)

## アーキテクチャ概要

このシステムは **Onion Architecture** を採用しており、以下のレイヤ構成となっています。

### レイヤ構成

```
┌─────────────────────────────────────────┐
│     Presentation Layer                  │
│  - Controllers (REST API)               │
│  - DTOs                                 │
│  - React Components                     │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Application Layer                   │
│  - Use Cases                            │
│  - Application Services                 │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Domain Layer                        │
│  - Entities                             │
│  - Value Objects                        │
│  - Domain Services                      │
│  - Repository Interfaces                │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Infrastructure Layer                │
│  - Repository Implementations           │
│  - External API Clients                 │
│  - Database Access                      │
└─────────────────────────────────────────┘
```

### レイヤごとの責務

#### Presentation Layer（プレゼンテーション層）

- **責務**: HTTP リクエスト/レスポンスの処理、ユーザーインターフェースの提供
- **主なコンポーネント**:
  - Controllers: REST APIエンドポイントの定義
  - DTOs: データ転送オブジェクト（リクエストは`class`、レスポンスは`interface`）
  - React Components: 資産残高表示コンポーネント

#### Application Layer（アプリケーション層）

- **責務**: ビジネスロジックの調整、ユースケースの実装
- **主なコンポーネント**:
  - Use Cases: 特定のビジネスユースケースの実装
  - Application Services: アプリケーション全体のサービス

#### Domain Layer（ドメイン層）

- **責務**: ビジネスルールとドメインロジックの実装
- **主なコンポーネント**:
  - Entities: ビジネスエンティティ
  - Value Objects: 値オブジェクト
  - Domain Services: ドメインサービス（集計ロジックなど）
  - Repository Interfaces: リポジトリのインターフェース

#### Infrastructure Layer（インフラストラクチャ層）

- **責務**: 外部システムとのやりとり、永続化
- **主なコンポーネント**:
  - Repository Implementations: リポジトリの実装
  - External API Clients: 外部APIクライアント
  - Database Access: データベースアクセス

## 主要機能

### 金融機関別資産残高表示

**概要**: 各金融機関の現在残高を集計し、総資産や機関別の構成比を視覚化する。

**実装箇所**:

- Controller: `AggregationController`（既存・拡張）
- Use Case: `CalculateAssetBalanceUseCase`（新規作成）
- Component: `InstitutionAssetBalance`（新規作成）
- Component: `AssetBalanceCard`（新規作成）
- Component: `AssetBalanceGraph`（新規作成）

**主な機能**:

1. すべての金融機関情報を取得
2. 各口座の最新残高を取得
3. クレジットカードの未払い額を取得（負債として扱う）
4. 資産合計を計算
5. 負債合計を計算
6. 純資産を計算（資産 - 負債）
7. 構成比を計算
8. 前月同日の残高を取得して増減を計算
9. 総資産カードを表示
10. 機関別リストを表示
11. 資産構成グラフ（横棒グラフ）を描画

### 既存実装との関係

既存の`CalculateInstitutionSummaryUseCase`（FR-017）は期間内の取引を集計するが、FR-026は現在の資産残高を表示する。既存の`institution-summary` APIは期間内の収支を集計するが、FR-026は現在時点の残高に特化している。

既存の`AccountEntity`の`balance`フィールドを活用し、各口座の現在残高を集計する。

## 技術スタック

### Backend

- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Architecture**: Onion Architecture
- **ORM**: TypeORM
- **Database**: MySQL (本番), JSON (開発)

### Frontend

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: React, Tailwind CSS
- **グラフライブラリ**: Recharts（既存）

## データモデル

### 主要エンティティ

#### InstitutionEntity（既存）

```typescript
interface InstitutionEntity {
  id: string;
  name: string;
  type: InstitutionType; // BANK, CREDIT_CARD, SECURITIES
  accounts: AccountEntity[];
  isConnected: boolean;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

#### AccountEntity（既存）

```typescript
interface AccountEntity {
  id: string;
  institutionId: string;
  accountNumber: string;
  accountName: string;
  balance: number; // 現在の残高
  currency: string;
}
```

#### AssetSummary（Value Object - 新規作成）

```typescript
interface AssetSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  institutions: InstitutionAsset[];
  asOfDate: Date;
  comparison: {
    previousMonth: AssetComparison;
    previousYear: AssetComparison;
  };
}

interface InstitutionAsset {
  institutionId: string;
  institutionName: string;
  institutionType: InstitutionType;
  icon: string;
  accounts: AccountAsset[];
  total: number;
  percentage: number;
}

interface AccountAsset {
  accountId: string;
  accountName: string;
  accountType: AccountType;
  balance: number;
  currency: string;
}

enum AccountType {
  SAVINGS = 'SAVINGS',
  TIME_DEPOSIT = 'TIME_DEPOSIT',
  CREDIT_CARD = 'CREDIT_CARD',
  STOCK = 'STOCK',
  MUTUAL_FUND = 'MUTUAL_FUND',
  OTHER = 'OTHER',
}

interface AssetComparison {
  diff: number;
  rate: number;
}
```

## API仕様概要

詳細は [入出力設計](./input-output-design.md) を参照。

### 主要エンドポイント

| メソッド | エンドポイント                   | 説明               |
| -------- | -------------------------------- | ------------------ |
| GET      | `/api/aggregation/asset-balance` | 資産残高情報を取得 |

## セキュリティ考慮事項

- [ ] 認証・認可の実装（将来対応）
- [x] 入力値のバリデーション（基準日の妥当性チェック）
- [x] SQLインジェクション対策（パラメータ化クエリ使用）
- [x] XSS対策（ReactのJSXによる自動エスケープを基本とする。ユーザーが入力したHTMLを意図的に表示する必要がある場合は、DOMPurifyなどのライブラリを使用してサニタイズ処理を必須とする）
- [ ] CSRF対策（将来対応）
- [ ] APIレート制限（将来対応）

## パフォーマンス考慮事項

- [x] データベースクエリの最適化（金融機関・口座情報の一括取得）
- [x] インデックスの適用（金融機関ID・口座ID）
- [ ] キャッシング戦略（将来対応：資産残高のキャッシュ）
- [ ] 前月比計算の最適化（必要に応じて）

## エラーハンドリング

### エラー分類

1. **バリデーションエラー** (400 Bad Request)
   - 基準日の形式エラー
   - 無効なパラメータ

2. **リソース未検出** (200 OK - 空データ)
   - 金融機関が存在しない場合：空配列を返す（404ではなく200 OKで空データを返す）

3. **サーバーエラー** (500 Internal Server Error)
   - 予期しないエラー（DB接続失敗など）

### エラーレスポンス形式

```typescript
interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  code?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  timestamp: string;
  path: string;
}
```

## テスト方針

### ユニットテスト

- **対象**: Domain Layer, Application Layer
- **ツール**: Jest
- **カバレッジ目標**: 80%以上

### 統合テスト

- **対象**: API エンドポイント
- **ツール**: Supertest + Jest
- **テスト内容**: HTTPリクエスト/レスポンスの検証

### E2Eテスト

- **対象**: ユーザーシナリオ
- **ツール**: Playwright
- **テスト内容**: 画面操作フローの検証

## 実装上の注意事項

1. **型安全性の遵守**
   - `any`型の使用禁止
   - すべての関数に適切な型定義
   - Enum型の比較は型安全に（`Object.entries()`使用時は明示的型キャスト）

2. **依存性の方向**
   - 外側のレイヤから内側のレイヤへのみ依存
   - ドメイン層は他のレイヤに依存しない
   - Domain層のエンティティは、Presentation層のDTO型に依存してはならない

3. **エラーハンドリング**
   - すべての非同期処理にエラーハンドリング
   - カスタム例外クラスの使用
   - 空配列（[]）は正常な応答として扱う（500エラーにしない）

4. **ロギング**
   - 重要な処理にログ出力
   - 機密情報のログ出力禁止

5. **計算ロジックの精度**
   - 金額は整数（円単位）で扱う（浮動小数点の計算誤差を避ける）
   - 割合計算時は適切な丸め処理を実施

6. **日付計算**
   - 基準日の妥当性チェック
   - 前月同日の計算（閏年対応）

7. **資産・負債の分類**
   - 残高がプラスの口座は資産として扱う
   - 残高がマイナスの口座（クレジットカードの未払い額など）は負債として扱う
   - 純資産 = 資産合計 - 負債合計

## 関連ドキュメント

- [機能要件書](../../functional-requirements/FR-023-027_visualization.md#fr-026-金融機関別資産残高表示)
- [システムアーキテクチャ](../../system-architecture.md)
- [既存実装: CalculateInstitutionSummaryUseCase](../FR-017_institution-aggregation/README.md)

## 変更履歴

| バージョン | 日付       | 変更内容 | 作成者       |
| ---------- | ---------- | -------- | ------------ |
| 1.0        | 2025-01-27 | 初版作成 | AI Assistant |

## チェックリスト

設計書作成時の確認事項：

### 必須項目

- [x] アーキテクチャ図が記載されている
- [x] 主要エンティティが定義されている
- [x] APIエンドポイントが一覧化されている
- [x] クラス図へのリンクが設定されている
- [x] シーケンス図へのリンクが設定されている
- [x] 入出力設計へのリンクが設定されている

### 推奨項目

- [x] セキュリティ考慮事項が記載されている
- [x] パフォーマンス考慮事項が記載されている
- [x] エラーハンドリング方針が明確
- [x] テスト方針が記載されている

### オプション項目

- [ ] 画面遷移図が作成されている（画面がある場合）
- [ ] 状態遷移図が作成されている（複雑な状態管理がある場合）
- [ ] バッチ処理詳細が作成されている（バッチ処理がある場合）
