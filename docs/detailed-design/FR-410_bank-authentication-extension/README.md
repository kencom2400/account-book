# 銀行認証方式の拡張 (FR-410) モジュール詳細設計書

**対象機能**:

- FR-410: 銀行認証方式の拡張 - ユーザID＋パスワード認証対応（三菱UFJ銀行・みずほ銀行）

**作成日**: 2025-12-18
**最終更新日**: 2025-12-18
**バージョン**: 1.0

## 概要

このドキュメントは、銀行認証方式の拡張 (FR-410) に関するモジュールの詳細設計を文書化したものです。

**簡単な機能説明**: 三菱UFJ銀行、みずほ銀行など、ユーザID＋パスワードによる認証を行う銀行に対応するため、認証方式を拡張します。現在の実装では支店コード、口座番号、（オプション）APIキー、シークレットでの認証のみをサポートしていますが、これらの銀行では認証ができない状態です。本機能では、銀行ごとに異なる認証方式（支店コード＋口座番号、ユーザID＋パスワードなど）を柔軟にサポートできる拡張性のある設計を実現します。

## 目次

1. [画面遷移図](./screen-transitions.md) - 画面がある場合
2. [クラス図](./class-diagrams.md) - **必須**
3. [シーケンス図](./sequence-diagrams.md) - **必須**
4. [状態遷移図](./state-transitions.md) - 複雑な状態管理がある場合
5. [入出力設計](./input-output-design.md) - **必須** (API仕様)
6. [バッチ処理詳細](./batch-processing.md) - バッチ処理がある場合

## アーキテクチャ概要

このシステムは **Onion Architecture** を採用しており、以下のレイヤ構成となっています。

### レイヤ構成

```
┌─────────────────────────────────────────┐
│     Presentation Layer                  │
│  - Controllers (REST API)               │
│  - DTOs                                 │
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

- **責務**: HTTP リクエスト/レスポンスの処理
- **主なコンポーネント**:
  - Controllers: REST APIエンドポイントの定義
  - DTOs: データ転送オブジェクト

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
  - Domain Services: ドメインサービス
  - Repository Interfaces: リポジトリのインターフェース

#### Infrastructure Layer（インフラストラクチャ層）

- **責務**: 外部システムとのやりとり、永続化
- **主なコンポーネント**:
  - Repository Implementations: リポジトリの実装
  - External API Clients: 外部APIクライアント
  - Database Access: データベースアクセス

## 主要機能

### 認証方式の拡張

**概要**: 銀行ごとに異なる認証方式（支店コード＋口座番号、ユーザID＋パスワードなど）を柔軟にサポートできるように、認証タイプを列挙型で定義し、銀行マスターデータに認証タイプ情報を追加します。

**実装箇所**:

- Domain Layer: `AuthenticationType` enum（新規）
- Domain Layer: `BankCredentials`型の拡張（`libs/types/src/bank.types.ts`）
- Infrastructure Layer: 銀行マスターデータに認証タイプ情報を追加（`apps/backend/src/modules/institution/infrastructure/data/banks.data.ts`）
- Application Layer: 認証方式に応じたバリデーションロジック（`apps/backend/src/modules/institution/presentation/dto/create-institution.dto.ts`）
- Presentation Layer: 認証方式に応じた入力フォームの切り替え（`apps/frontend/src/components/forms/BankCredentialsForm.tsx`）

### 認証方式に応じたバリデーション

**概要**: 認証方式（支店コード＋口座番号、ユーザID＋パスワード）に応じて、必要なフィールドのバリデーションを動的に切り替えます。

**実装箇所**:

- Presentation Layer: DTOのバリデーション（`apps/backend/src/modules/institution/presentation/dto/create-institution.dto.ts`）
- Presentation Layer: フロントエンド側のバリデーション（`apps/frontend/src/components/forms/BankCredentialsForm.tsx`）

### 認証方式に応じたUI切り替え

**概要**: 選択した銀行の認証方式に応じて、入力フォームを動的に切り替えます（支店コード＋口座番号フォーム、ユーザID＋パスワードフォーム）。

**実装箇所**:

- Frontend: `apps/frontend/src/components/forms/BankCredentialsForm.tsx`
- Frontend: `apps/frontend/src/app/banks/add/page.tsx`

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

## データモデル

### 認証タイプの列挙型

```typescript
enum AuthenticationType {
  BRANCH_ACCOUNT = 'branch_account', // 支店コード＋口座番号
  USERID_PASSWORD = 'userid_password', // ユーザID＋パスワード
  // 将来的に他の認証方式も追加可能
}
```

### BankCredentials型の拡張

```typescript
interface BankCredentials {
  bankCode: string; // 銀行コード（4桁数字）
  authenticationType: AuthenticationType; // 認証タイプ

  // 支店コード＋口座番号認証の場合
  branchCode?: string; // 支店コード（3桁数字）
  accountNumber?: string; // 口座番号（7桁数字）
  apiKey?: string; // APIキー（銀行によって異なる）
  apiSecret?: string; // APIシークレット（銀行によって異なる）

  // ユーザID＋パスワード認証の場合
  userId?: string; // ユーザID
  password?: string; // パスワード（暗号化して保存）

  [key: string]: unknown; // その他の銀行固有の認証情報
}
```

### 銀行マスターデータの拡張

```typescript
interface Bank {
  id: string;
  code: string; // 銀行コード（4桁）
  name: string;
  category: BankCategory;
  isSupported: boolean;
  authenticationType: AuthenticationType; // 新規追加: 認証タイプ
}
```

### 主要エンティティ

#### InstitutionEntity

既存の`InstitutionEntity`は変更なし。認証情報は`EncryptedCredentials`として暗号化して保存されます。

## API仕様概要

詳細は [入出力設計](./input-output-design.md) を参照。

### 主要エンドポイント

既存のエンドポイントは変更なし。認証方式の拡張により、リクエスト/レスポンスのDTOが拡張されます。

| メソッド | エンドポイント                      | 説明                                     |
| -------- | ----------------------------------- | ---------------------------------------- |
| POST     | `/api/institutions`                 | 金融機関登録（認証情報の形式が拡張）     |
| POST     | `/api/institutions/test-connection` | 接続テスト（認証情報の形式が拡張）       |
| GET      | `/api/institutions/supported-banks` | 対応銀行一覧取得（認証タイプ情報を含む） |

## セキュリティ考慮事項

- [x] 認証・認可の実装（既存実装を継承）
- [x] 入力値のバリデーション（認証方式に応じたバリデーション追加）
- [x] パスワードの暗号化（既存のAES-256-GCM暗号化機能を活用）
- [x] 認証情報の安全な保存・取得処理（既存の`EncryptedCredentials`を使用）
- [x] SQLインジェクション対策（既存実装を継承）
- [x] XSS対策（既存実装を継承）
- [x] CSRF対策（既存実装を継承）
- [x] APIレート制限（既存実装を継承）

## パフォーマンス考慮事項

- [ ] データベースクエリの最適化
- [ ] インデックスの適用
- [ ] キャッシング戦略
- [ ] ページネーション実装
- [ ] 不要なデータの遅延読み込み

## エラーハンドリング

### エラー分類

1. **バリデーションエラー** (400 Bad Request)
   - 入力値の形式エラー
   - 必須項目の欠如

2. **認証エラー** (401 Unauthorized)
   - トークン無効
   - トークン期限切れ

3. **認可エラー** (403 Forbidden)
   - アクセス権限なし

4. **リソース未検出** (404 Not Found)
   - 指定されたリソースが存在しない

5. **サーバーエラー** (500 Internal Server Error)
   - 予期しないエラー

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

2. **依存性の方向**
   - 外側のレイヤから内側のレイヤへのみ依存
   - ドメイン層は他のレイヤに依存しない

3. **エラーハンドリング**
   - すべての非同期処理にエラーハンドリング
   - カスタム例外クラスの使用

4. **ロギング**
   - 重要な処理にログ出力
   - 機密情報のログ出力禁止

## 関連ドキュメント

- [Issue #410](https://github.com/kencom2400/account-book/issues/410) - 銀行認証方式の拡張
- [システムアーキテクチャ](../../system-architecture.md)
- [既存実装: 金融機関連携機能](../FR-001-005_institution-integration/)

## 変更履歴

| バージョン | 日付       | 変更内容                        | 作成者     |
| ---------- | ---------- | ------------------------------- | ---------- |
| 1.0        | 2025-12-18 | 初版作成（Phase 1: 要件定義書） | kencom2400 |

## チェックリスト

設計書作成時の確認事項：

### 必須項目

- [x] アーキテクチャ図が記載されている
- [x] 主要エンティティが定義されている（認証タイプ、BankCredentials型の拡張）
- [x] APIエンドポイントが一覧化されている
- [x] クラス図へのリンクが設定されている
- [x] シーケンス図へのリンクが設定されている
- [x] 入出力設計へのリンクが設定されている

### 推奨項目

- [x] セキュリティ考慮事項が記載されている
- [x] パフォーマンス考慮事項が記載されている（既存実装を継承）
- [x] エラーハンドリング方針が明確（既存実装を継承）
- [x] テスト方針が記載されている（既存実装を継承）
- [x] 画面遷移図が作成されている（認証方式に応じた入力フォームの切り替え）

### オプション項目

- [ ] 状態遷移図が作成されている（認証方式の切り替えは単純なため不要と判断）
- [ ] バッチ処理詳細が作成されている（バッチ処理なし）

## Phase 1: 要件定義書作成の進捗

### 完了項目

- [x] README.mdの作成（概要、主要機能、データモデル、API仕様概要）
- [x] クラス図の作成（認証タイプの列挙型、BankCredentials型の拡張、バリデーションロジック）
- [x] シーケンス図の作成（認証方式に応じた処理フロー、接続テストフロー）
- [x] 入出力設計の作成（API仕様、DTOの拡張、リクエスト/レスポンス例）
- [x] 画面遷移図の作成（認証方式に応じた入力フォームの切り替え）

### Phase 1 完了

Phase 1の要件定義書作成が完了しました。次のステップは実装（Phase 2）です。

### 未着手項目（実装時に実施）

- [ ] 三菱UFJ銀行API仕様の調査（外部リソース、実装時に確認）
- [ ] みずほ銀行API仕様の調査（外部リソース、実装時に確認）
