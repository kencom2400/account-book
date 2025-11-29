# シーケンス図

このドキュメントでは、費目のカスタマイズ機能（FR-011）の処理フローをシーケンス図で記載しています。

## 目次

1. [費目追加のフロー](#費目追加のフロー)
2. [費目編集のフロー](#費目編集のフロー)
3. [費目削除のフロー（使用中）](#費目削除のフロー使用中)
4. [費目一覧取得のフロー](#費目一覧取得のフロー)
5. [費目使用状況確認のフロー](#費目使用状況確認のフロー)
6. [エラーハンドリングフロー](#エラーハンドリングフロー)

---

## 費目追加のフロー

### 概要

**ユースケース**: ユーザーが新しいカスタム費目を追加する

**アクター**: ユーザー

**前提条件**:

- ユーザーが費目管理画面にアクセスしている
- 有効な親カテゴリ（収入/支出/振替/返済/投資）が選択されている

**成功時の結果**:

- 新しい費目がデータベースに保存される
- 費目一覧に新規費目が表示される

### 正常系フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend<br/>(CategoryManagementPage)
    participant Form as CategoryForm
    participant API as CategoryController
    participant UC as CreateCategoryUseCase
    participant DS as CategoryDomainService
    participant Repo as CategoryRepository
    participant DB as Database

    User->>FE: 「費目を追加」ボタンクリック
    FE->>Form: フォーム表示

    User->>Form: 費目情報入力<br/>(名前, カテゴリ, アイコン, 色)
    Form->>Form: クライアント側バリデーション

    User->>Form: 「追加」ボタンクリック
    Form->>API: POST /api/categories<br/>{CreateCategoryDto}

    API->>API: DTOバリデーション
    API->>UC: execute(createRequest)

    UC->>UC: リクエスト検証

    UC->>DS: checkDuplicateName(name, type)
    DS->>Repo: findByName(name, type)
    Repo->>DB: SELECT * FROM categories<br/>WHERE name = ? AND type = ?
    DB-->>Repo: 結果（重複なし）
    Repo-->>DS: null
    DS-->>UC: false（重複なし）

    UC->>DS: generateOrder(type)
    DS->>Repo: countByType(type)
    Repo->>DB: SELECT COUNT(*) FROM categories<br/>WHERE type = ?
    DB-->>Repo: カウント
    Repo-->>DS: count
    DS-->>UC: order (1000 + count)

    UC->>UC: CategoryEntity作成<br/>(ID生成, order設定)

    UC->>Repo: save(category)
    Repo->>DB: INSERT INTO categories
    DB-->>Repo: 成功
    Repo-->>UC: 保存されたCategory

    UC-->>API: CreateCategoryResult
    API->>API: CategoryResponseDtoに変換
    API-->>FE: 201 Created<br/>{CategoryResponseDto}

    FE->>FE: 費目一覧を更新
    FE-->>User: 成功メッセージ表示<br/>「費目を追加しました」
```

### ステップ詳細

1. **ユーザーアクション**
   - 費目管理画面で「費目を追加」ボタンをクリック

2. **フォーム表示**
   - CategoryFormコンポーネントがモーダルで表示される
   - 必須項目: 費目名、親カテゴリ
   - 任意項目: アイコン、色

3. **Frontend バリデーション**
   - 費目名: 1-50文字
   - 親カテゴリ: 有効なCategoryType
   - 色: HEXカラーコード形式

4. **API リクエスト**
   - エンドポイント: `POST /api/categories`
   - RequestDTO: `CreateCategoryDto`

5. **UseCase 実行**
   - 重複チェック（同一親カテゴリ内で同名の費目がないか）
   - 表示順序の生成（カスタム費目は1000以降）
   - UUIDでIDを生成
   - トランザクション境界: save()メソッド内

6. **データ永続化**
   - `categories`テーブルにINSERT
   - `is_system_defined: false`として保存

7. **レスポンス**
   - ResponseDTO: `CategoryResponseDto`
   - HTTPステータス: 201 Created

---

## 費目編集のフロー

### 概要

**ユースケース**: 既存費目の名称、アイコン、色を編集する

**アクター**: ユーザー

**前提条件**:

- 編集対象の費目が存在する
- 費目が編集可能（デフォルト費目も編集可）

**成功時の結果**:

- 費目情報が更新される
- 費目一覧に更新内容が反映される

### 正常系フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as CategoryController
    participant UC as UpdateCategoryUseCase
    participant DS as CategoryDomainService
    participant Repo as CategoryRepository
    participant DB as Database

    User->>FE: 費目の「編集」ボタンクリック
    FE->>API: GET /api/categories/:id
    API->>Repo: findById(id)
    Repo->>DB: SELECT
    DB-->>Repo: CategoryEntity
    Repo-->>API: CategoryEntity
    API-->>FE: 200 OK<br/>{CategoryResponseDto}

    FE->>FE: 編集フォーム表示<br/>(初期値セット)

    User->>FE: 費目情報を変更<br/>(名前, アイコン, 色)

    User->>FE: 「保存」ボタンクリック
    FE->>API: PUT /api/categories/:id<br/>{UpdateCategoryDto}

    API->>API: DTOバリデーション
    API->>UC: execute(id, updateRequest)

    UC->>Repo: findById(id)
    Repo->>DB: SELECT
    DB-->>Repo: CategoryEntity
    Repo-->>UC: CategoryEntity

    UC->>UC: 編集可能性の検証<br/>(canBeModified())

    alt 名前が変更された場合
        UC->>DS: checkDuplicateName(newName, type)
        DS->>Repo: findByName(newName, type)
        Repo->>DB: SELECT
        DB-->>Repo: null（重複なし）
        Repo-->>DS: null
        DS-->>UC: false（重複なし）
    end

    UC->>UC: 変更を適用<br/>(名前, アイコン, 色)

    UC->>Repo: update(category)
    Repo->>DB: UPDATE categories<br/>SET name = ?, icon = ?, color = ?,<br/>updated_at = NOW()
    DB-->>Repo: 成功
    Repo-->>UC: 更新されたCategory

    UC-->>API: UpdateCategoryResult
    API-->>FE: 200 OK<br/>{CategoryResponseDto}

    FE->>FE: 費目一覧を更新
    FE-->>User: 成功メッセージ表示<br/>「費目を更新しました」
```

### ステップ詳細

1. **費目情報取得**
   - 編集対象の費目をAPIから取得
   - 編集フォームに初期値として設定

2. **バリデーション**
   - 編集可能性の検証（削除不可のデフォルト費目も編集は可能）
   - 名前が変更された場合、重複チェックを実行

3. **更新処理**
   - 変更された項目のみを適用
   - `updated_at`タイムスタンプを更新

4. **親カテゴリの変更**
   - 親カテゴリ（type）の変更は不可
   - UIで無効化される

---

## 費目削除のフロー（使用中）

### 概要

**ユースケース**: 使用中の費目を代替費目に置き換えて削除する

**アクター**: ユーザー

**前提条件**:

- 削除対象の費目が存在する
- 削除対象の費目が取引データで使用されている

**成功時の結果**:

- すべての取引データが代替費目に置き換えられる
- 費目が論理削除される

### 正常系フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant Dialog as CategoryDeleteDialog
    participant API as CategoryController
    participant UC as DeleteCategoryUseCase
    participant DS as CategoryDomainService
    participant CatRepo as CategoryRepository
    participant TxRepo as TransactionRepository
    participant DB as Database

    User->>FE: 費目の「削除」ボタンクリック

    FE->>API: GET /api/categories/:id/usage
    API->>DS: checkCategoryUsage(id)
    DS->>TxRepo: countByCategoryId(id)
    TxRepo->>DB: SELECT COUNT(*)<br/>FROM transactions<br/>WHERE category_id = ?
    DB-->>TxRepo: count
    TxRepo-->>DS: usageCount

    DS->>TxRepo: findByCategoryId(id, limit 10)
    TxRepo->>DB: SELECT *<br/>FROM transactions<br/>WHERE category_id = ?<br/>LIMIT 10
    DB-->>TxRepo: transactions
    TxRepo-->>DS: transactionIds

    DS-->>API: UsageInfo<br/>{isUsed: true, count: 50, ids: [...]}
    API-->>FE: 200 OK<br/>{UsageResponseDto}

    FE->>Dialog: 削除ダイアログ表示<br/>(使用状況を表示)

    Dialog->>Dialog: 代替費目選択UIを表示
    User->>Dialog: 代替費目を選択

    User->>Dialog: 「削除」ボタンクリック
    Dialog->>API: DELETE /api/categories/:id<br/>?replacementCategoryId=xxx

    API->>UC: execute(id, replacementId)

    UC->>CatRepo: findById(id)
    CatRepo->>DB: SELECT
    DB-->>CatRepo: CategoryEntity
    CatRepo-->>UC: Category（削除対象）

    UC->>UC: 削除可能性の検証<br/>(デフォルト費目は不可)

    UC->>CatRepo: findById(replacementId)
    CatRepo->>DB: SELECT
    DB-->>CatRepo: CategoryEntity
    CatRepo-->>UC: Category（代替費目）

    UC->>UC: 代替費目の検証<br/>(同一type, 有効な費目)

    Note over UC,DB: トランザクション開始

    UC->>DS: replaceCategoryInTransactions(id, replacementId)
    DS->>TxRepo: updateCategoryId(id, replacementId)
    TxRepo->>DB: UPDATE transactions<br/>SET category_id = ?<br/>WHERE category_id = ?
    DB-->>TxRepo: 更新件数
    TxRepo-->>DS: replacedCount
    DS-->>UC: replacedCount

    UC->>CatRepo: delete(id)
    CatRepo->>DB: UPDATE categories<br/>SET is_active = false<br/>WHERE id = ?
    DB-->>CatRepo: 成功
    CatRepo-->>UC: 成功

    Note over UC,DB: トランザクションコミット

    UC-->>API: DeleteCategoryResult<br/>{success: true, replacedCount: 50}
    API-->>FE: 200 OK<br/>{DeleteResponseDto}

    FE->>FE: 費目一覧を更新
    FE-->>User: 成功メッセージ表示<br/>「50件の取引を移行して<br/>費目を削除しました」
```

### ステップ詳細

1. **使用状況確認**
   - 削除前に費目の使用状況を確認
   - 使用中の取引件数と取引IDのサンプル（先頭10件）を取得

2. **代替費目選択**
   - 使用中の場合、削除ダイアログで代替費目の選択を促す
   - 同じ親カテゴリの費目のみ選択可能

3. **バリデーション**
   - デフォルト費目は削除不可
   - 代替費目が同じカテゴリタイプであることを検証

4. **トランザクション内での一括処理**
   - すべての取引データの費目を代替費目に更新
   - 費目を論理削除（`is_active = false`）
   - ロールバック可能

5. **完了通知**
   - 移行した取引件数をユーザーに通知

---

## 費目一覧取得のフロー

### 概要

**ユースケース**: すべての費目（デフォルト + カスタム）を取得する

**アクター**: ユーザー

**前提条件**:

- なし

**成功時の結果**:

- 費目一覧が階層構造で表示される

### 正常系フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant Cache as CategoryCache
    participant API as CategoryController
    participant UC as GetCategoriesUseCase
    participant Repo as CategoryRepository
    participant DB as Database

    User->>FE: 費目管理画面を開く

    FE->>Cache: get('all_categories')
    Cache-->>FE: null（キャッシュなし）

    FE->>API: GET /api/categories

    API->>UC: execute()

    UC->>Repo: findAll()
    Repo->>DB: SELECT * FROM categories<br/>WHERE is_active = true<br/>ORDER BY type, order, name
    DB-->>Repo: CategoryEntity[]
    Repo-->>UC: categories

    UC->>UC: 階層構造の構築<br/>(parent-child関係)

    UC-->>API: GetCategoriesResult<br/>{success: true, categories: [...]}

    API-->>FE: 200 OK<br/>{CategoryListResponseDto}

    FE->>Cache: set('all_categories', categories, TTL=5min)

    FE->>FE: カテゴリタブごとにグループ化
    FE->>FE: 一覧表示<br/>(デフォルト/カスタムを区別)

    FE-->>User: 費目一覧を表示
```

### カテゴリタイプフィルタリング

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant API as CategoryController
    participant UC as GetCategoriesUseCase
    participant Repo as CategoryRepository

    User->>FE: カテゴリタブをクリック<br/>（例: 支出）

    FE->>API: GET /api/categories?type=EXPENSE
    API->>UC: execute(type)
    UC->>Repo: findByType('EXPENSE')
    Repo-->>UC: categories（支出のみ）
    UC-->>API: GetCategoriesResult
    API-->>FE: 200 OK

    FE->>FE: 支出費目のみを表示
    FE-->>User: 絞り込まれた一覧
```

---

## 費目使用状況確認のフロー

### 概要

**ユースケース**: 費目が取引データで使用されているか確認する

**アクター**: システム（削除前に自動実行）

**前提条件**:

- 対象費目が存在する

**成功時の結果**:

- 使用状況情報が返却される

### 正常系フロー

```mermaid
sequenceDiagram
    participant Dialog as CategoryDeleteDialog
    participant API as CategoryController
    participant UC as CheckCategoryUsageUseCase
    participant DS as CategoryDomainService
    participant TxRepo as TransactionRepository
    participant DB as Database

    Dialog->>API: GET /api/categories/:id/usage

    API->>UC: execute(id)

    UC->>DS: checkCategoryUsage(id)

    DS->>TxRepo: countByCategoryId(id)
    TxRepo->>DB: SELECT COUNT(*)<br/>FROM transactions<br/>WHERE category_id = ?
    DB-->>TxRepo: count
    TxRepo-->>DS: usageCount

    alt usageCount > 0
        DS->>TxRepo: findByCategoryId(id, limit 10)
        TxRepo->>DB: SELECT id<br/>FROM transactions<br/>WHERE category_id = ?<br/>LIMIT 10
        DB-->>TxRepo: transactionIds
        TxRepo-->>DS: transactionIds

        DS-->>UC: UsageInfo<br/>{isUsed: true, count, ids}
    else usageCount = 0
        DS-->>UC: UsageInfo<br/>{isUsed: false, count: 0, ids: []}
    end

    UC-->>API: UsageCheckResult
    API-->>Dialog: 200 OK<br/>{UsageResponseDto}

    Dialog->>Dialog: 使用状況に応じてUIを更新
```

---

## エラーハンドリングフロー

### バリデーションエラー (400 Bad Request)

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant API as CategoryController
    participant UC as CreateCategoryUseCase
    participant DS as CategoryDomainService

    User->>FE: 不正な入力<br/>(費目名が空)
    FE->>API: POST /api/categories<br/>{name: ""}

    API->>API: DTOバリデーション失敗
    API-->>FE: 400 Bad Request<br/>{error: "費目名は必須です"}

    FE-->>User: エラーメッセージ表示
```

### 重複エラー (400 Bad Request)

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant API as CategoryController
    participant UC as CreateCategoryUseCase
    participant DS as CategoryDomainService

    User->>FE: 既存の費目名を入力
    FE->>API: POST /api/categories<br/>{name: "ペット", type: "EXPENSE"}

    API->>UC: execute(request)
    UC->>DS: checkDuplicateName("ペット", "EXPENSE")
    DS-->>UC: true（重複あり）

    UC-->>API: CreateCategoryResult<br/>{success: false, error: "CategoryAlreadyExistsException"}
    API-->>FE: 400 Bad Request<br/>{error: "この費目名は既に存在します"}

    FE-->>User: エラーメッセージ表示
```

### デフォルト費目削除エラー (403 Forbidden)

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant API as CategoryController
    participant UC as DeleteCategoryUseCase
    participant Repo as CategoryRepository

    User->>FE: デフォルト費目の削除を試行
    FE->>API: DELETE /api/categories/:id

    API->>UC: execute(id, null)
    UC->>Repo: findById(id)
    Repo-->>UC: Category（isSystemDefined: true）

    UC->>UC: validateDeletion(category)
    UC-->>API: DeleteCategoryResult<br/>{success: false, error: "SystemCategoryDeletionException"}

    API-->>FE: 403 Forbidden<br/>{error: "デフォルト費目は削除できません"}

    FE-->>User: エラーメッセージ表示
```

### 使用中費目削除エラー (409 Conflict)

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant API as CategoryController
    participant UC as DeleteCategoryUseCase
    participant DS as CategoryDomainService

    User->>FE: 使用中費目を代替費目なしで削除試行
    FE->>API: DELETE /api/categories/:id

    API->>UC: execute(id, null)
    UC->>DS: checkCategoryUsage(id)
    DS-->>UC: UsageInfo{isUsed: true, count: 50}

    UC-->>API: DeleteCategoryResult<br/>{success: false, error: "CategoryInUseException"}

    API-->>FE: 409 Conflict<br/>{error: "この費目は使用中です。<br/>代替費目を指定してください"}

    FE-->>User: エラーメッセージ表示<br/>(代替費目選択を促す)
```

### 費目が見つからない (404 Not Found)

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant API as CategoryController
    participant UC as UpdateCategoryUseCase
    participant Repo as CategoryRepository

    User->>FE: 存在しない費目の編集を試行
    FE->>API: PUT /api/categories/invalid-id<br/>{UpdateCategoryDto}

    API->>UC: execute("invalid-id", request)
    UC->>Repo: findById("invalid-id")
    Repo-->>UC: null

    UC-->>API: UpdateCategoryResult<br/>{success: false, error: "CategoryNotFoundException"}

    API-->>FE: 404 Not Found<br/>{error: "指定された費目が見つかりません"}

    FE-->>User: エラーメッセージ表示
```

---

## トランザクション境界

### 費目削除時のトランザクション

```mermaid
sequenceDiagram
    participant UC as DeleteCategoryUseCase
    participant TxRepo as TransactionRepository
    participant CatRepo as CategoryRepository
    participant DB as Database

    Note over UC,DB: @Transaction() デコレーター適用

    UC->>DB: BEGIN TRANSACTION

    UC->>TxRepo: updateCategoryId(oldId, newId)
    TxRepo->>DB: UPDATE transactions
    DB-->>TxRepo: 成功

    UC->>CatRepo: delete(id)
    CatRepo->>DB: UPDATE categories
    DB-->>CatRepo: 成功

    alt すべて成功
        UC->>DB: COMMIT
        UC-->>UC: 成功を返す
    else エラーが発生
        UC->>DB: ROLLBACK
        UC-->>UC: エラーを返す
    end
```

---

## パフォーマンス最適化

### キャッシング戦略

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant Cache as CategoryCache<br/>(Client-side)
    participant API as CategoryController
    participant Repo as CategoryRepository
    participant DB as Database

    FE->>Cache: get('categories')

    alt キャッシュヒット（5分以内）
        Cache-->>FE: categories（キャッシュから）
        FE->>FE: 一覧表示
    else キャッシュミス
        FE->>API: GET /api/categories
        API->>Repo: findAll()
        Repo->>DB: SELECT
        DB-->>Repo: categories
        Repo-->>API: categories
        API-->>FE: categories
        FE->>Cache: set('categories', categories, TTL=5min)
        FE->>FE: 一覧表示
    end
```

---

## 参考資料

- [README.md](./README.md) - 設計書の概要
- [class-diagrams.md](./class-diagrams.md) - クラス構造
- [input-output-design.md](./input-output-design.md) - API仕様
- [screen-transitions.md](./screen-transitions.md) - 画面遷移
