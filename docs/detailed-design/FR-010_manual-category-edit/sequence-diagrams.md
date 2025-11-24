# シーケンス図

このドキュメントでは、FR-010（費目の手動修正機能）の処理フローをシーケンス図で記載しています。

## 目次

1. [カテゴリ更新のフロー（正常系）](#カテゴリ更新のフロー正常系)
2. [カテゴリ更新のフロー（異常系）](#カテゴリ更新のフロー異常系)
3. [データベーストランザクション](#データベーストランザクション)

---

## カテゴリ更新のフロー（正常系）

### 概要

**ユースケース**: ユーザーが取引のカテゴリを手動で変更する

**アクター**: ユーザー

**前提条件**:

- 取引データがデータベースに存在すること
- カテゴリマスタが登録されていること
- フロントエンドでカテゴリ一覧が取得済みであること

**成功時の結果**:

- 取引のカテゴリが更新される
- カテゴリ変更履歴が記録される
- UIが更新される

### 正常系フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend<br/>(TransactionList)
    participant API as API Controller<br/>(TransactionController)
    participant UC as UseCase<br/>(UpdateTransactionCategory)
    participant TxRepo as TransactionRepository
    participant HisRepo as HistoryRepository
    participant DB as Database

    User->>FE: カテゴリをクリック
    FE->>FE: 編集モードに切り替え
    User->>FE: 新しいカテゴリを選択
    FE->>FE: バリデーション
    FE->>API: PATCH /api/transactions/:id/category<br/>{category: {...}}

    API->>API: リクエスト検証
    API->>UC: execute(dto)

    Note over UC: トランザクション外で検証
    UC->>TxRepo: findById(id)
    TxRepo->>DB: SELECT
    DB-->>TxRepo: transaction
    TxRepo-->>UC: TransactionEntity

    alt 取引が見つからない
        UC-->>API: NotFoundException
        API-->>FE: 404 Not Found
        FE->>FE: エラー表示
        FE-->>User: エラーメッセージ
    end

    UC->>UC: transaction.updateCategory(newCategory)

    Note over UC,DB: DBトランザクション開始
    UC->>DB: BEGIN TRANSACTION

    UC->>UC: TransactionCategoryChangeHistory<br/>Entity.create()
    UC->>HisRepo: entityManager.save(history)
    HisRepo->>DB: INSERT INTO<br/>transaction_category_change_history

    UC->>TxRepo: entityManager.save(transaction)
    TxRepo->>DB: UPDATE transactions<br/>SET categoryId, categoryName, categoryType, updatedAt

    UC->>DB: COMMIT
    Note over UC,DB: DBトランザクション完了

    UC-->>API: TransactionEntity
    API->>API: toJSON()
    API-->>FE: 200 OK<br/>{success: true, data: {...}}
    FE->>FE: UI更新
    FE->>FE: 編集モード解除
    FE-->>User: カテゴリ更新完了
```

### ステップ詳細

1. **ユーザーアクション**
   - ユーザーが取引一覧のカテゴリをクリック
   - セレクトボックスが表示される

2. **Frontend バリデーション**
   - 新しいカテゴリIDが有効であることを確認
   - カテゴリマスタに存在することを確認

3. **API リクエスト**
   - エンドポイント: `PATCH /api/transactions/:id/category`
   - RequestDTO: `{category: {id, name, type}}`

4. **UseCase 実行**
   - トランザクション外で取引の存在確認（パフォーマンス最適化）
   - ドメインエンティティでカテゴリ更新
   - データベーストランザクションで変更履歴記録と取引更新をアトミックに実行

5. **データベース永続化**
   - 変更履歴テーブルに INSERT
   - 取引テーブルを UPDATE
   - トランザクションコミット

6. **レスポンス**
   - ResponseDTO: `TransactionResponseDto`
   - HTTPステータス: 200 OK

---

## カテゴリ更新のフロー（異常系）

### 異常系1: 取引が存在しない

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as Controller
    participant UC as UseCase
    participant Repo as Repository

    FE->>API: PATCH /api/transactions/:id/category<br/>{category: {...}}
    API->>UC: execute(dto)
    UC->>Repo: findById(id)
    Repo-->>UC: null

    UC->>UC: NotFoundException生成
    UC-->>API: throw NotFoundException

    API->>API: エラーハンドリング
    API-->>FE: 404 Not Found<br/>{success: false, message: "Transaction not found"}
    FE->>FE: エラーメッセージ表示
```

**エラーレスポンス例**:

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Transaction with id abc123 not found"
}
```

### 異常系2: バリデーションエラー

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as Controller

    FE->>API: PATCH /api/transactions/:id/category<br/>{category: {}}

    API->>API: リクエスト検証
    API->>API: バリデーションエラー検出

    API-->>FE: 400 Bad Request<br/>{success: false, errors: [...]}
    FE->>FE: エラーメッセージ表示
```

**エラーレスポンス例**:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "category.id",
      "message": "category.id must be a string"
    },
    {
      "field": "category.name",
      "message": "category.name must not be empty"
    }
  ]
}
```

### 異常系3: データベースエラー

```mermaid
sequenceDiagram
    participant API as Controller
    participant UC as UseCase
    participant DB as Database

    API->>UC: execute(dto)
    UC->>UC: 取引存在確認OK
    UC->>DB: BEGIN TRANSACTION
    UC->>DB: INSERT history
    UC->>DB: UPDATE transaction
    DB--xUC: DatabaseError<br/>(例: デッドロック)

    Note over UC,DB: TypeORMが自動的にロールバック

    UC->>UC: エラーログ出力
    UC-->>API: throw InternalServerErrorException

    API->>API: エラーハンドリング
    API-->>API: 500 Internal Server Error<br/>{success: false, message: "..."}
```

**エラーレスポンス例**:

```json
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## データベーストランザクション

### トランザクション境界の詳細

```mermaid
sequenceDiagram
    participant UC as UseCase
    participant DS as DataSource
    participant EM as EntityManager
    participant HisRepo as HistoryRepo
    participant TxRepo as TransactionRepo
    participant DB as Database

    UC->>DS: transaction((entityManager) => {...})
    DS->>DB: BEGIN TRANSACTION

    Note over UC,EM: トランザクション内処理
    UC->>EM: getRepository(HistoryOrmEntity)
    EM-->>UC: historyRepo

    UC->>HisRepo: save(historyData)
    HisRepo->>DB: INSERT INTO<br/>transaction_category_change_history
    DB-->>HisRepo: OK
    HisRepo-->>UC: saved history

    UC->>EM: getRepository(TransactionOrmEntity)
    EM-->>UC: transactionRepo

    UC->>TxRepo: save(transactionData)
    TxRepo->>DB: UPDATE transactions<br/>SET categoryId, categoryName, categoryType, updatedAt
    DB-->>TxRepo: OK
    TxRepo-->>UC: updated transaction

    alt すべて成功
        UC->>DS: return updatedTransaction
        DS->>DB: COMMIT
        DB-->>DS: OK
        DS-->>UC: updatedTransaction
    else エラー発生
        UC->>DS: throw Error
        DS->>DB: ROLLBACK
        DB-->>DS: OK
        DS-->>UC: Error
    end
```

### トランザクション管理の特徴

**トランザクション境界**:

- 変更履歴の記録と取引の更新を1つのトランザクションで実行
- すべての操作が成功するか、すべて失敗するかのどちらか（原子性）

**パフォーマンス最適化**:

- 取引の存在確認はトランザクション外で実施
- トランザクション内では実際の更新処理のみを実行
- 不要なロック時間を削減

**エラーハンドリング**:

- トランザクション内でエラーが発生した場合、自動的にロールバック
- データの整合性を常に保証

---

## Frontend UIフロー

### カテゴリ編集UI

```mermaid
sequenceDiagram
    actor User
    participant TxList as TransactionList<br/>Component
    participant API as API Function<br/>(updateTransactionCategory)
    participant Backend as Backend API

    User->>TxList: カテゴリをクリック
    TxList->>TxList: setEditingId(transactionId)
    TxList->>TxList: セレクトボックス表示

    User->>TxList: 新しいカテゴリを選択
    TxList->>TxList: setUpdating(transactionId)
    TxList->>TxList: セレクトボックス無効化

    TxList->>API: updateTransactionCategory(transactionId, category)
    API->>Backend: PATCH /api/transactions/:id/category

    alt 成功
        Backend-->>API: 200 OK
        API-->>TxList: updatedTransaction
        TxList->>TxList: onTransactionUpdate(updatedTransaction)
        TxList->>TxList: setEditingId(null)
        TxList->>TxList: setUpdating(null)
        TxList->>TxList: UI更新
    else エラー
        Backend-->>API: 4xx/5xx Error
        API--xTxList: Error
        TxList->>TxList: setError("カテゴリの更新に失敗しました")
        TxList->>TxList: setUpdating(null)
        TxList->>TxList: エラーメッセージ表示
    end
```

### 状態管理

**State**:

- `categories`: カテゴリ一覧（初期ロード時に取得）
- `editingId`: 編集中の取引ID
- `updating`: 更新中の取引ID（ローディング表示用）
- `error`: エラーメッセージ

**状態遷移**:

1. 初期状態: `editingId=null, updating=null, error=null`
2. カテゴリクリック: `editingId=transactionId`
3. カテゴリ選択: `updating=transactionId`
4. 更新成功: `editingId=null, updating=null`
5. 更新失敗: `updating=null, error="..."`

---

## パフォーマンス考慮事項

### 最適化ポイント

```mermaid
sequenceDiagram
    participant UC as UseCase
    participant Repo as Repository
    participant DB as Database

    Note over UC: 最適化1: トランザクション外で検証
    UC->>Repo: findById(id)
    Repo->>DB: SELECT (ロックなし)
    DB-->>Repo: transaction
    Repo-->>UC: TransactionEntity

    UC->>UC: ビジネスロジック実行<br/>(ドメインエンティティ操作)

    Note over UC,DB: 最適化2: トランザクション内は更新のみ
    UC->>DB: BEGIN TRANSACTION
    UC->>DB: INSERT history (高速)
    UC->>DB: UPDATE transaction (高速)
    UC->>DB: COMMIT
    Note over UC,DB: ロック時間最小化
```

**最適化効果**:

- トランザクション外での検証により、ロック時間を最小化
- トランザクション内では必要最小限の操作のみを実行
- 並行処理の競合リスクを低減

---

## チェックリスト

シーケンス図作成時の確認事項：

### 基本項目

- [x] 主要なユースケースがすべて記載されている
- [x] アクター、参加者が明確に定義されている
- [x] 正常系フローが記載されている
- [x] 異常系フローが記載されている

### 詳細項目

- [x] エラーハンドリングが明確
- [x] トランザクション境界が明確
- [x] レスポンスの型とステータスコードが明記されている
- [x] データベース操作の詳細が記載されている

### 実装ガイド

- [x] 各ステップに説明が付与されている
- [x] 前提条件が明確
- [x] 成功時の結果が明確

---

## Mermaid記法のヒント

### 基本構文

```mermaid
sequenceDiagram
    participant A as 参加者A
    participant B as 参加者B

    A->>B: 同期メッセージ
    A-->>B: 非同期メッセージ
    A-xB: 失敗メッセージ
    B-->>A: 応答
```

### 条件分岐

```mermaid
sequenceDiagram
    alt 条件1
        A->>B: 処理1
    else 条件2
        A->>C: 処理2
    end
```

### ノート

```mermaid
sequenceDiagram
    Note over A,B: ノートの内容
    Note right of A: 右側のノート
    Note left of B: 左側のノート
```
