# データベーススキーマ設計書

**文書バージョン**: 1.1  
**作成日**: 2025-11-22  
**最終更新日**: 2025-11-22  
**最終変更**: Issue #125 Repository実装のDB対応

## 目次

1. [概要](#概要)
2. [ER図](#er図)
3. [テーブル定義](#テーブル定義)
4. [インデックス設計](#インデックス設計)
5. [外部キー制約](#外部キー制約)
6. [データ型の選択理由](#データ型の選択理由)
7. [パフォーマンス最適化](#パフォーマンス最適化)
8. [今後の拡張予定](#今後の拡張予定)

---

## 概要

このドキュメントは、Account Bookアプリケーションのデータベーススキーマ設計を詳細に記述します。

### 設計原則

1. **正規化と非正規化のバランス**
   - 基本的に第3正規形を目指す
   - パフォーマンス最適化のため、一部のフィールドを非正規化（例：transactions.category_name）

2. **拡張性の確保**
   - 将来の機能追加を見越したスキーマ設計
   - JSON型の活用（柔軟なデータ構造）

3. **データ整合性の保証**
   - 外部キー制約の適切な設定
   - NOT NULL制約の適切な使用

4. **パフォーマンス最適化**
   - 頻繁に検索されるカラムへのインデックス設定
   - 複合インデックスの活用

---

## ER図

```
┌──────────────────┐
│   categories     │
│                  │
│  PK  id          │◄─────┐
│      name        │      │
│      type        │      │ parent_id
│  FK  parent_id   │──────┘
│      icon        │
│      color       │
│      order       │
│      ...         │
└────────┬─────────┘
         │
         │ category_id
         │
         ▼
┌──────────────────────────┐          ┌──────────────────┐
│      transactions        │          │   institutions   │
│                          │          │                  │
│  PK  id                  │          │  PK  id          │
│      date                │  ┌───────┤      name        │
│      amount              │  │       │      type        │
│  FK  category_id         │  │       │      credentials │
│      category_name       │  │       │      accounts    │
│      category_type       │  │       │      ...         │
│      description         │  │       └──────────────────┘
│  FK  institution_id      │──┘
│  FK  account_id          │
│      status              │
│      is_reconciled       │
│  FK  related_transaction │
│      ...                 │
└──────────────────────────┘

┌──────────────────────────┐
│      credit_cards        │
│                          │
│  PK  id                  │
│      card_name           │
│      card_number         │
│      card_holder_name    │
│      expiry_date         │
│      credentials         │
│      payment_day         │
│      closing_day         │
│      credit_limit        │
│      current_balance     │
│      issuer              │
│      ...                 │
└──────────────────────────┘
```

---

## テーブル定義

### 1. categories（カテゴリ）

カテゴリ情報を管理するテーブル。階層構造をサポート。

| カラム名          | データ型     | NULL     | デフォルト                  | 説明                                                               |
| ----------------- | ------------ | -------- | --------------------------- | ------------------------------------------------------------------ |
| id                | VARCHAR(36)  | NOT NULL | -                           | 主キー（UUID）                                                     |
| name              | VARCHAR(255) | NOT NULL | -                           | カテゴリ名                                                         |
| type              | ENUM         | NOT NULL | -                           | カテゴリタイプ（income, expense, transfer, repayment, investment） |
| parent_id         | VARCHAR(36)  | NULL     | NULL                        | 親カテゴリID（階層構造用）                                         |
| icon              | VARCHAR(50)  | NULL     | NULL                        | アイコン名                                                         |
| color             | VARCHAR(20)  | NULL     | NULL                        | カラーコード                                                       |
| is_system_defined | BOOLEAN      | NOT NULL | false                       | システム定義フラグ                                                 |
| order             | INT          | NOT NULL | 0                           | 表示順序                                                           |
| created_at        | TIMESTAMP    | NOT NULL | CURRENT_TIMESTAMP           | 作成日時                                                           |
| updated_at        | TIMESTAMP    | NOT NULL | CURRENT_TIMESTAMP ON UPDATE | 更新日時                                                           |

**主キー**: id  
**外部キー**: parent_id → categories(id) ON DELETE CASCADE  
**インデックス**:

- IDX_CATEGORIES_TYPE (type)
- IDX_CATEGORIES_PARENT_ID (parent_id)

**備考**:

- 階層構造は親子関係で実現（最大2階層を想定）
- is_system_defined = true のカテゴリは削除不可

---

### 2. institutions（金融機関）

金融機関情報を管理するテーブル。

| カラム名             | データ型     | NULL     | デフォルト                  | 説明                                        |
| -------------------- | ------------ | -------- | --------------------------- | ------------------------------------------- |
| id                   | VARCHAR(60)  | NOT NULL | -                           | 主キー（プレフィックス付きUUID）            |
| name                 | VARCHAR(255) | NOT NULL | -                           | 金融機関名（UNIQUE）                        |
| type                 | ENUM         | NOT NULL | -                           | 機関タイプ（bank, credit_card, securities） |
| encrypted_api_key    | TEXT         | NULL     | NULL                        | 暗号化されたAPIキー                         |
| encrypted_api_secret | TEXT         | NULL     | NULL                        | 暗号化されたAPIシークレット                 |
| encryption_iv        | VARCHAR(255) | NULL     | NULL                        | 暗号化IV                                    |
| encryption_auth_tag  | VARCHAR(255) | NULL     | NULL                        | 暗号化認証タグ                              |
| encryption_algorithm | VARCHAR(50)  | NULL     | NULL                        | 暗号化アルゴリズム                          |
| encryption_version   | VARCHAR(20)  | NULL     | NULL                        | 暗号化バージョン                            |
| is_connected         | BOOLEAN      | NOT NULL | false                       | 接続状態                                    |
| last_synced_at       | TIMESTAMP    | NULL     | NULL                        | 最終同期日時                                |
| created_at           | TIMESTAMP    | NOT NULL | CURRENT_TIMESTAMP           | 作成日時                                    |
| updated_at           | TIMESTAMP    | NOT NULL | CURRENT_TIMESTAMP ON UPDATE | 更新日時                                    |

**主キー**: id  
**ユニーク制約**: name  
**インデックス**:

- IDX_INSTITUTIONS_TYPE (type)
- IDX_INSTITUTIONS_IS_CONNECTED (is_connected)

**備考**:

- encrypted_api_key/encrypted_api_secret は AES-256-GCM で暗号化
- 暗号化情報は複数カラムに分割して保存（単一JSONフィールドではなく）
- accounts は別テーブル `accounts` として分離

---

### 3. accounts（口座）

**実装変更**: Phase 1.1でaccountsテーブルを追加しました。

金融機関に紐づく口座情報を管理するテーブル。

| カラム名       | データ型      | NULL     | デフォルト                  | 説明                           |
| -------------- | ------------- | -------- | --------------------------- | ------------------------------ |
| id             | VARCHAR(60)   | NOT NULL | -                           | 主キー（プレフィックス付UUID） |
| institution_id | VARCHAR(60)   | NOT NULL | -                           | 金融機関ID                     |
| account_number | VARCHAR(255)  | NOT NULL | -                           | 口座番号（マスクされた形式）   |
| account_name   | VARCHAR(255)  | NOT NULL | -                           | 口座名                         |
| balance        | DECIMAL(15,2) | NOT NULL | -                           | 残高                           |
| currency       | VARCHAR(3)    | NOT NULL | JPY                         | 通貨コード                     |
| created_at     | TIMESTAMP     | NOT NULL | CURRENT_TIMESTAMP           | 作成日時                       |
| updated_at     | TIMESTAMP     | NOT NULL | CURRENT_TIMESTAMP ON UPDATE | 更新日時                       |

**主キー**: id  
**外部キー**: institution_id → institutions(id) ON DELETE CASCADE  
**インデックス**:

- MySQL は外部キー制約を持つカラムに自動的にインデックスを作成するため、明示的なインデックス定義は不要

**備考**:

- institution_id の外部キー制約により、金融機関削除時に関連口座も自動削除（CASCADE）
- MySQL は外部キー用のインデックスを自動作成

---

### 4. securities_accounts（証券口座）

**新規追加**: Phase 1.1で証券口座管理機能を追加しました。

証券口座情報を管理するテーブル。

| カラム名         | データ型     | NULL     | デフォルト                  | 説明                           |
| ---------------- | ------------ | -------- | --------------------------- | ------------------------------ |
| id               | VARCHAR(60)  | NOT NULL | -                           | 主キー（プレフィックス付UUID） |
| account_number   | VARCHAR(255) | NOT NULL | -                           | 証券口座番号                   |
| institution_name | VARCHAR(255) | NOT NULL | -                           | 証券会社名                     |
| connected_at     | TIMESTAMP    | NOT NULL | -                           | 接続日時                       |
| last_synced_at   | TIMESTAMP    | NULL     | NULL                        | 最終同期日時                   |
| created_at       | TIMESTAMP    | NOT NULL | CURRENT_TIMESTAMP           | 作成日時                       |
| updated_at       | TIMESTAMP    | NOT NULL | CURRENT_TIMESTAMP ON UPDATE | 更新日時                       |

**主キー**: id  
**インデックス**: なし（テーブルサイズが小さいため）

**備考**:

- IDは `sec_acc_` プレフィックス付きUUID（最大60文字）
- 将来的に institutions テーブルと統合する可能性あり

---

### 5. holdings（保有銘柄）

**新規追加**: Phase 1.1で証券保有銘柄管理機能を追加しました。

証券口座での保有銘柄情報を管理するテーブル。

| カラム名              | データ型      | NULL     | デフォルト                  | 説明                           |
| --------------------- | ------------- | -------- | --------------------------- | ------------------------------ |
| id                    | VARCHAR(60)   | NOT NULL | -                           | 主キー（プレフィックス付UUID） |
| securities_account_id | VARCHAR(60)   | NOT NULL | -                           | 証券口座ID                     |
| symbol                | VARCHAR(20)   | NOT NULL | -                           | 銘柄コード                     |
| name                  | VARCHAR(255)  | NOT NULL | -                           | 銘柄名                         |
| quantity              | DECIMAL(15,2) | NOT NULL | -                           | 保有数量                       |
| average_price         | DECIMAL(15,2) | NOT NULL | -                           | 平均取得単価                   |
| current_price         | DECIMAL(15,2) | NOT NULL | -                           | 現在価格                       |
| created_at            | TIMESTAMP     | NOT NULL | CURRENT_TIMESTAMP           | 作成日時                       |
| updated_at            | TIMESTAMP     | NOT NULL | CURRENT_TIMESTAMP ON UPDATE | 更新日時                       |

**主キー**: id  
**外部キー**: securities_account_id → securities_accounts(id) ON DELETE CASCADE  
**インデックス**:

- MySQL は外部キー制約を持つカラムに自動的にインデックスを作成するため、明示的なインデックス定義は不要

**備考**:

- IDは `holding_` プレフィックス付きUUID（最大60文字）
- securities_account_id の外部キー制約により、証券口座削除時に保有銘柄も自動削除（CASCADE）
- MySQL は外部キー用のインデックスを自動作成

---

### 6. security_transactions（証券取引履歴）

**新規追加**: Phase 1.1で証券取引履歴管理機能を追加しました。

証券口座での取引履歴を管理するテーブル。

| カラム名              | データ型      | NULL     | デフォルト                  | 説明                           |
| --------------------- | ------------- | -------- | --------------------------- | ------------------------------ |
| id                    | VARCHAR(60)   | NOT NULL | -                           | 主キー（プレフィックス付UUID） |
| securities_account_id | VARCHAR(60)   | NOT NULL | -                           | 証券口座ID                     |
| date                  | TIMESTAMP     | NOT NULL | -                           | 取引日時                       |
| type                  | VARCHAR(20)   | NOT NULL | -                           | 取引種別（buy, sell）          |
| symbol                | VARCHAR(20)   | NOT NULL | -                           | 銘柄コード                     |
| quantity              | DECIMAL(15,2) | NOT NULL | -                           | 数量                           |
| price                 | DECIMAL(15,2) | NOT NULL | -                           | 単価                           |
| total_amount          | DECIMAL(15,2) | NOT NULL | -                           | 合計金額                       |
| created_at            | TIMESTAMP     | NOT NULL | CURRENT_TIMESTAMP           | 作成日時                       |
| updated_at            | TIMESTAMP     | NOT NULL | CURRENT_TIMESTAMP ON UPDATE | 更新日時                       |

**主キー**: id  
**外部キー**: securities_account_id → securities_accounts(id) ON DELETE CASCADE  
**インデックス**:

- MySQL は外部キー制約を持つカラムに自動的にインデックスを作成するため、明示的なインデックス定義は不要

**備考**:

- IDは `sec_tx_` プレフィックス付きUUID（最大60文字）
- securities_account_id の外部キー制約により、証券口座削除時に取引履歴も自動削除（CASCADE）
- MySQL は外部キー用のインデックスを自動作成

---

### 7. credit_cards（クレジットカード）

クレジットカード情報を管理するテーブル。

**注意**: 現在の実装では credit_cards は独立したテーブルとして実装されていますが、概念的には institutions の一種（type='credit_card'）として扱われるべきです。将来的には institutions テーブルに統合するか、外部キーで関連付けることを検討してください。

| カラム名              | データ型      | NULL     | デフォルト                  | 説明                 |
| --------------------- | ------------- | -------- | --------------------------- | -------------------- |
| id                    | VARCHAR(36)   | NOT NULL | -                           | 主キー（UUID）       |
| card_name             | VARCHAR(255)  | NOT NULL | -                           | カード名             |
| card_number           | VARCHAR(4)    | NOT NULL | -                           | カード番号下4桁      |
| card_holder_name      | VARCHAR(255)  | NOT NULL | -                           | カード名義人         |
| expiry_date           | DATE          | NOT NULL | -                           | 有効期限             |
| encrypted_credentials | TEXT          | NOT NULL | -                           | 暗号化された認証情報 |
| is_connected          | BOOLEAN       | NOT NULL | false                       | 接続状態             |
| last_synced_at        | TIMESTAMP     | NULL     | NULL                        | 最終同期日時         |
| payment_day           | INT           | NOT NULL | -                           | 引き落とし日         |
| closing_day           | INT           | NOT NULL | -                           | 締め日               |
| credit_limit          | DECIMAL(15,2) | NOT NULL | -                           | 利用限度額           |
| current_balance       | DECIMAL(15,2) | NOT NULL | -                           | 現在の残高           |
| issuer                | VARCHAR(255)  | NOT NULL | -                           | 発行会社             |
| created_at            | TIMESTAMP     | NOT NULL | CURRENT_TIMESTAMP           | 作成日時             |
| updated_at            | TIMESTAMP     | NOT NULL | CURRENT_TIMESTAMP ON UPDATE | 更新日時             |

**主キー**: id  
**インデックス**:

- IDX_CREDIT_CARDS_ISSUER (issuer)
- IDX_CREDIT_CARDS_IS_CONNECTED (is_connected)

**備考**:

- card_number は下4桁のみ保存（セキュリティのため）
- payment_day, closing_day は1-31の範囲

---

### 8. transactions（取引）

取引情報を管理するテーブル。

| カラム名               | データ型      | NULL     | デフォルト                  | 説明                                                |
| ---------------------- | ------------- | -------- | --------------------------- | --------------------------------------------------- |
| id                     | VARCHAR(60)   | NOT NULL | -                           | 主キー（プレフィックス付UUID）                      |
| date                   | DATE          | NOT NULL | -                           | 取引日                                              |
| amount                 | DECIMAL(15,2) | NOT NULL | -                           | 金額                                                |
| category_id            | VARCHAR(60)   | NOT NULL | -                           | カテゴリID                                          |
| category_name          | VARCHAR(255)  | NOT NULL | -                           | カテゴリ名（非正規化）                              |
| category_type          | ENUM          | NOT NULL | -                           | カテゴリタイプ（非正規化）                          |
| description            | TEXT          | NOT NULL | -                           | 説明                                                |
| institution_id         | VARCHAR(60)   | NOT NULL | -                           | 金融機関ID                                          |
| account_id             | VARCHAR(60)   | NOT NULL | -                           | 口座ID                                              |
| status                 | ENUM          | NOT NULL | completed                   | ステータス（pending, completed, failed, cancelled） |
| is_reconciled          | BOOLEAN       | NOT NULL | false                       | 照合済みフラグ                                      |
| related_transaction_id | VARCHAR(60)   | NULL     | NULL                        | 関連取引ID（振替用）                                |
| created_at             | TIMESTAMP     | NOT NULL | CURRENT_TIMESTAMP           | 作成日時                                            |
| updated_at             | TIMESTAMP     | NOT NULL | CURRENT_TIMESTAMP ON UPDATE | 更新日時                                            |

**主キー**: id  
**外部キー**:

- category_id → categories(id) ON DELETE RESTRICT
- institution_id → institutions(id) ON DELETE RESTRICT

**インデックス**:

- IDX_TRANSACTIONS_DATE_INSTITUTION (date, institution_id)
- IDX_TRANSACTIONS_CATEGORY (category_id)
- IDX_TRANSACTIONS_STATUS (status)
- MySQL は外部キー制約を持つカラムに自動的にインデックスを作成

**備考**:

- IDは `tx_` プレフィックス付きUUID（最大60文字）
- category_name と category_type は非正規化データ（パフォーマンス最適化）
- 取引の検索・表示時にカテゴリテーブルへのJOINを回避
- カテゴリ名変更時はアプリケーション側で整合性を維持
- **重要**: related_transaction_id は振替取引の関連付けに使用されるが、現在の実装では外部キー制約は設定されていない（データ整合性の観点から、将来的に外部キー制約の追加を検討）

---

## インデックス設計

### インデックス戦略

1. **単一カラムインデックス**
   - 頻繁に検索条件として使用されるカラム
   - 外部キー
   - ENUM型のカラム（カーディナリティが低いが、頻繁に使用）

2. **複合インデックス**
   - 同時に検索条件として使用されるカラムの組み合わせ
   - 左端一致の原則を考慮

3. **ユニークインデックス**
   - ビジネスルールで一意性が必要なカラム

4. **外部キー用インデックス**
   - MySQLは外部キー制約を持つカラムに自動的にインデックスを作成
   - 明示的なインデックス定義は不要（重複を避ける）

### インデックス一覧

| テーブル              | インデックス名                    | カラム                | タイプ      | 備考                                  |
| --------------------- | --------------------------------- | --------------------- | ----------- | ------------------------------------- |
| categories            | PRIMARY                           | id                    | PRIMARY KEY | -                                     |
| categories            | IDX_CATEGORIES_TYPE               | type                  | INDEX       | -                                     |
| categories            | IDX_CATEGORIES_PARENT_ID          | parent_id             | INDEX       | MySQL外部キー自動インデックス         |
| institutions          | PRIMARY                           | id                    | PRIMARY KEY | -                                     |
| institutions          | name                              | name                  | UNIQUE      | -                                     |
| institutions          | IDX_INSTITUTIONS_TYPE             | type                  | INDEX       | -                                     |
| institutions          | IDX_INSTITUTIONS_IS_CONNECTED     | is_connected          | INDEX       | -                                     |
| accounts              | PRIMARY                           | id                    | PRIMARY KEY | -                                     |
| accounts              | IDX_FK_ACCOUNTS_INSTITUTION       | institution_id        | INDEX       | MySQL外部キー自動インデックス         |
| securities_accounts   | PRIMARY                           | id                    | PRIMARY KEY | -                                     |
| holdings              | PRIMARY                           | id                    | PRIMARY KEY | -                                     |
| holdings              | IDX_FK_HOLDINGS_SECURITIES_ACC    | securities_account_id | INDEX       | MySQL外部キー自動インデックス         |
| security_transactions | PRIMARY                           | id                    | PRIMARY KEY | -                                     |
| security_transactions | IDX_FK_SEC_TX_SECURITIES_ACC      | securities_account_id | INDEX       | MySQL外部キー自動インデックス         |
| credit_cards          | PRIMARY                           | id                    | PRIMARY KEY | -                                     |
| credit_cards          | IDX_CREDIT_CARDS_ISSUER           | issuer                | INDEX       | -                                     |
| credit_cards          | IDX_CREDIT_CARDS_IS_CONNECTED     | is_connected          | INDEX       | -                                     |
| transactions          | PRIMARY                           | id                    | PRIMARY KEY | -                                     |
| transactions          | IDX_TRANSACTIONS_DATE_INSTITUTION | date, institution_id  | INDEX       | -                                     |
| transactions          | IDX_TRANSACTIONS_CATEGORY         | category_id           | INDEX       | MySQL外部キー自動インデックス         |
| transactions          | IDX_TRANSACTIONS_STATUS           | status                | INDEX       | -                                     |
| transactions          | IDX_FK_TX_INSTITUTION             | institution_id        | INDEX       | MySQL外部キー自動インデックス（暗黙） |

### インデックス選択の理由

**IDX_TRANSACTIONS_DATE_INSTITUTION**:

- 最も頻繁に使用される検索パターン：「特定期間の特定金融機関の取引」
- date が先頭（範囲検索が多い）
- institution_id が2番目（等価検索）

**IDX_TRANSACTIONS_CATEGORY**:

- カテゴリ別の集計に使用
- 外部キー制約によるパフォーマンス向上

**IDX_TRANSACTIONS_STATUS**:

- 未完了取引の検索に使用
- カーディナリティは低いが、検索頻度が高い

---

## 外部キー制約

### 制約一覧

| 制約名                      | 親テーブル          | 親カラム | 子テーブル            | 子カラム              | ON DELETE | ON UPDATE | 備考            |
| --------------------------- | ------------------- | -------- | --------------------- | --------------------- | --------- | --------- | --------------- |
| FK_CATEGORIES_PARENT        | categories          | id       | categories            | parent_id             | CASCADE   | CASCADE   | -               |
| FK_ACCOUNTS_INSTITUTION     | institutions        | id       | accounts              | institution_id        | CASCADE   | CASCADE   | Phase 1.1で追加 |
| FK_HOLDINGS_SECURITIES_ACC  | securities_accounts | id       | holdings              | securities_account_id | CASCADE   | CASCADE   | Phase 1.1で追加 |
| FK_SEC_TX_SECURITIES_ACC    | securities_accounts | id       | security_transactions | securities_account_id | CASCADE   | CASCADE   | Phase 1.1で追加 |
| FK_TRANSACTIONS_CATEGORY    | categories          | id       | transactions          | category_id           | RESTRICT  | CASCADE   | -               |
| FK_TRANSACTIONS_INSTITUTION | institutions        | id       | transactions          | institution_id        | RESTRICT  | CASCADE   | -               |

**注意**:

- transactions.related_transaction_id に対する自己参照外部キー制約は現在実装されていません。データ整合性の観点から、将来的に以下の制約の追加を推奨します：
- MySQLは外部キー制約を持つカラムに自動的にインデックスを作成するため、明示的なインデックス定義は不要です。重複インデックスを作成するとマイグレーション時にエラーが発生します。

```sql
ALTER TABLE transactions
ADD CONSTRAINT FK_TRANSACTIONS_RELATED
FOREIGN KEY (related_transaction_id)
REFERENCES transactions(id)
ON DELETE SET NULL;
```

### 削除ポリシー

**CASCADE（カスケード削除）**:

- categories.parent_id → categories.id
  - 親カテゴリを削除すると、子カテゴリも自動的に削除される
- accounts.institution_id → institutions.id (Phase 1.1で追加)
  - 金融機関を削除すると、関連する口座も自動的に削除される
- holdings.securities_account_id → securities_accounts.id (Phase 1.1で追加)
  - 証券口座を削除すると、保有銘柄も自動的に削除される
- security_transactions.securities_account_id → securities_accounts.id (Phase 1.1で追加)
  - 証券口座を削除すると、取引履歴も自動的に削除される

**RESTRICT（削除制限）**:

- transactions.category_id → categories.id
  - カテゴリに紐づく取引が存在する場合、カテゴリの削除を防止
- transactions.institution_id → institutions.id
  - 金融機関に紐づく取引が存在する場合、金融機関の削除を防止

---

## データ型の選択理由

### データ型の選択理由

### VARCHAR(60) for Prefixed UUIDs

- プレフィックス付きUUID v4を使用（例: `inst_`, `acc_`, `tx_`, `sec_acc_`, `holding_`, `sec_tx_`）
- 最大長60文字を確保（プレフィックス + UUID + マージン）
- 分散環境でも一意性を保証
- セキュリティ：連番IDよりも推測が困難
- 可読性：プレフィックスによりエンティティ種別が識別可能

### DECIMAL(15,2) for 金額

- 精度を保証（浮動小数点の問題を回避）
- 最大13桁の整数部（9,999,999,999,999円）
- 2桁の小数部（円未満の通貨に対応可能）

### ENUM for 限定された値

- データ整合性の保証
- ストレージ効率
- インデックス効率
- 使用箇所：
  - CategoryType: 'income', 'expense', 'transfer', 'repayment', 'investment'
  - InstitutionType: 'bank', 'credit_card', 'securities'
  - TransactionStatus: 'pending', 'completed', 'failed', 'cancelled'

### JSON for 柔軟なデータ構造

- institutions.accounts: 口座情報の配列
- 将来の拡張性を確保
- MySQL 5.7以降のJSON型は効率的

### TEXT for 長文

- encrypted_credentials: 暗号化データの長さが可変
- description: 取引の説明文

---

## パフォーマンス最適化

### 1. 非正規化による最適化

**transactions テーブル**:

- `category_name` と `category_type` を非正規化
- 理由：
  - 取引一覧表示時に毎回カテゴリテーブルへのJOINを回避
  - 読み取りが頻繁、書き込みは相対的に少ない
  - カテゴリ名の変更は稀
- トレードオフ：
  - データ整合性の維持はアプリケーション層で対応
  - カテゴリ名変更時に関連する取引レコードも更新が必要

### 2. インデックス戦略

**複合インデックスの活用**:

```sql
-- 以下のクエリで複合インデックスが使用される
SELECT * FROM transactions
WHERE date BETWEEN '2025-01-01' AND '2025-01-31'
  AND institution_id = 'inst_001';

-- インデックス: IDX_TRANSACTIONS_DATE_INSTITUTION (date, institution_id)
```

### 3. JSON型の活用

- accounts情報をJSONで保存することで、柔軟性を確保
- MySQL 8.0のJSON機能により、JSON内の検索も効率的

### 4. パーティショニング（将来の検討事項）

取引データが大量になった場合：

```sql
-- 月次パーティショニングの例（将来実装）
ALTER TABLE transactions
PARTITION BY RANGE (YEAR(date) * 100 + MONTH(date)) (
  PARTITION p202501 VALUES LESS THAN (202502),
  PARTITION p202502 VALUES LESS THAN (202503),
  ...
);
```

---

## 今後の拡張予定

### Phase 1.5: データ整合性の改善（優先度: 高）

#### 1. transactions.related_transaction_id への外部キー制約追加

振替取引の関連付けに使用される related_transaction_id に自己参照外部キー制約を追加し、データ整合性を保証します。

```sql
ALTER TABLE transactions
ADD CONSTRAINT FK_TRANSACTIONS_RELATED
FOREIGN KEY (related_transaction_id)
REFERENCES transactions(id)
ON DELETE SET NULL
ON UPDATE CASCADE;
```

**理由**:

- 存在しない取引IDへの参照を防止
- 関連取引が削除された場合は NULL に設定
- データの整合性を保証

#### 2. institutions と credit_cards の関係整理

現在、institutions と credit_cards は独立したテーブルですが、概念的には重複しています。以下のいずれかの方法で統合を検討します：

**オプションA**: credit_cards を institutions に統合

```sql
-- credit_cardsテーブルのデータをinstitutionsに移行
-- credit_cardsテーブルを削除
```

**オプションB**: credit_cards に institution_id を追加

```sql
ALTER TABLE credit_cards
ADD COLUMN institution_id VARCHAR(36),
ADD CONSTRAINT FK_CREDIT_CARDS_INSTITUTION
FOREIGN KEY (institution_id) REFERENCES institutions(id)
ON DELETE CASCADE;
```

**推奨**: オプションA（統合）を推奨。institutions.type='credit_card' として扱い、カード固有の情報は JSON フィールドまたは別のリレーションシップテーブルで管理。

### Phase 2: 追加予定のテーブル

#### 1. accounts（口座）テーブル

現在は institutions.accounts (JSON) として実装されているが、将来的に独立したテーブルに分離。

```sql
CREATE TABLE accounts (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL,
  account_number VARCHAR(20) NOT NULL,
  account_name VARCHAR(100) NOT NULL,
  balance DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'JPY',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
);
```

**理由**:

- 口座情報へのクエリ最適化
- 外部キー制約による整合性保証
- 口座ごとの履歴管理

#### 2. sync_logs（同期ログ）テーブル

```sql
CREATE TABLE sync_logs (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  status VARCHAR(20) NOT NULL,
  records_fetched INTEGER DEFAULT 0,
  error_message TEXT,
  duration INTEGER,
  FOREIGN KEY (institution_id) REFERENCES institutions(id),
  INDEX idx_sync_logs_institution (institution_id),
  INDEX idx_sync_logs_started_at (started_at)
);
```

**用途**:

- 同期処理の監視
- エラー追跡
- パフォーマンス分析

#### 3. auto_classification_rules（自動分類ルール）テーブル

```sql
CREATE TABLE auto_classification_rules (
  id VARCHAR(36) PRIMARY KEY,
  priority INTEGER NOT NULL,
  field VARCHAR(50) NOT NULL,
  operator VARCHAR(20) NOT NULL,
  value TEXT NOT NULL,
  category_id VARCHAR(36) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  match_count INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  INDEX idx_rules_priority (priority)
);
```

**用途**:

- 取引の自動カテゴリ分類
- ルールベースのカテゴリ推定
- 機械学習の補完

#### 4. events（イベント）テーブル

```sql
CREATE TABLE events (
  id VARCHAR(36) PRIMARY KEY,
  date DATE NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**用途**:

- イベントと取引の関連付け
- イベント別の支出分析
- カレンダー表示

### Phase 3: 機能拡張

1. **マルチユーザー対応**
   - users テーブルの追加
   - 認証・認可の実装
   - データのユーザー別分離

2. **予算管理**
   - budgets テーブルの追加
   - カテゴリ別予算設定
   - 予算実績対比

3. **タグ機能**
   - tags テーブルの追加
   - 多対多関係（transaction_tags）
   - 柔軟な分類

---

## 変更履歴

| バージョン | 日付       | 変更内容                                                                 | 変更者 | 関連Issue |
| ---------- | ---------- | ------------------------------------------------------------------------ | ------ | --------- |
| 1.1        | 2025-11-22 | Phase 1.1実装完了に伴う更新                                              | System | #125      |
|            |            | - institutionsテーブルの認証情報を複数カラムに分割                       |        |           |
|            |            | - accountsテーブルを追加（JSON→独立テーブル化）                          |        |           |
|            |            | - securities_accounts, holdings, security_transactionsテーブルを追加     |        |           |
|            |            | - IDカラムをVARCHAR(60)に変更（プレフィックス付UUID対応）                |        |           |
|            |            | - CASCADE削除ポリシーの追加（accounts, holdings, security_transactions） |        |           |
|            |            | - MySQL外部キー自動インデックス仕様の明記                                |        |           |
| 1.0        | 2025-11-22 | 初版作成                                                                 | System | #123      |

---

**文書バージョン**: 1.1  
**作成日**: 2025-11-22  
**最終更新日**: 2025-11-22  
**最終変更**: Issue #125 Repository実装のDB対応
