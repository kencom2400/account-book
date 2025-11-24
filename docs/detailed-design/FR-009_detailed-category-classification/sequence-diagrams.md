# シーケンス図

このドキュメントでは、詳細費目分類機能の主要な処理フローをシーケンス図で記載しています。

## 目次

1. [サブカテゴリ一覧取得フロー](#サブカテゴリ一覧取得フロー)
2. [カテゴリ別サブカテゴリ取得フロー](#カテゴリ別サブカテゴリ取得フロー)
3. [詳細費目自動分類フロー（店舗マスタ照合）](#詳細費目自動分類フロー店舗マスタ照合)
4. [詳細費目自動分類フロー（キーワードマッチング）](#詳細費目自動分類フローキーワードマッチング)
5. [取引データへのサブカテゴリ適用フロー](#取引データへのサブカテゴリ適用フロー)
6. [店舗マスタ登録フロー](#店舗マスタ登録フロー)

---

## サブカテゴリ一覧取得フロー

### 全サブカテゴリ取得

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend<br/>(SubcategorySelector)
    participant API as Backend API<br/>(SubcategoryController)
    participant UC as GetSubcategoriesUseCase
    participant Repo as SubcategoryRepository
    participant DB as MySQL Database

    User->>UI: 費目選択UIを開く
    UI->>API: GET /api/subcategories

    API->>UC: execute()
    UC->>Repo: findAll()
    Repo->>DB: SELECT * FROM subcategories<br/>WHERE is_active = true<br/>ORDER BY display_order
    DB-->>Repo: SubcategoryOrmEntity[]
    Repo->>Repo: toDomain(entities)
    Repo-->>UC: Subcategory[]

    UC->>UC: groupByCategory(subcategories)
    Note over UC: カテゴリ別にグループ化
    UC->>UC: sortByDisplayOrder(subcategories)

    UC-->>API: SubcategoryListResult
    API-->>UI: 200 OK + SubcategoryResponseDto
    UI->>UI: 階層表示用にツリー構築
    UI->>User: サブカテゴリ一覧表示
```

---

## カテゴリ別サブカテゴリ取得フロー

### 特定カテゴリのサブカテゴリ取得

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend<br/>(SubcategoryTree)
    participant API as Backend API<br/>(SubcategoryController)
    participant UC as GetSubcategoriesByCategoryUseCase
    participant Repo as SubcategoryRepository
    participant DB as MySQL Database

    User->>UI: カテゴリタブ選択（例: 支出）
    UI->>API: GET /api/subcategories/category/EXPENSE

    API->>UC: execute(CategoryType.EXPENSE)
    UC->>UC: validateCategory(categoryType)

    UC->>Repo: findByCategory(CategoryType.EXPENSE)
    Repo->>DB: SELECT * FROM subcategories<br/>WHERE category_type = 'EXPENSE'<br/>AND is_active = true<br/>ORDER BY display_order
    DB-->>Repo: SubcategoryOrmEntity[]
    Repo-->>UC: Subcategory[]

    UC->>UC: buildHierarchy(subcategories)
    Note over UC: parent_idを使って階層構造を構築:<br/>食費<br/>├─ 食料品<br/>├─ 外食<br/>└─ カフェ

    UC-->>API: SubcategoryListResult
    API-->>UI: 200 OK + SubcategoryResponseDto
    UI->>UI: ツリー形式で表示
    UI->>User: 支出カテゴリの費目一覧表示
```

---

## 詳細費目自動分類フロー（店舗マスタ照合）

### 店舗名からサブカテゴリを推測

```mermaid
sequenceDiagram
    actor System
    participant TxSvc as TransactionService
    participant API as Backend API<br/>(SubcategoryController)
    participant UC as ClassifySubcategoryUseCase
    participant Classifier as SubcategoryClassifierService
    participant Matcher as MerchantMatcher
    participant MerchantRepo as MerchantRepository
    participant SubcatRepo as SubcategoryRepository
    participant DB as MySQL Database

    System->>TxSvc: 取引データ受信
    Note over System,TxSvc: description: "スターバックス 表参道店"<br/>amount: -450<br/>mainCategory: EXPENSE

    TxSvc->>API: POST /api/subcategories/classify
    Note over TxSvc,API: ClassificationRequestDto

    API->>UC: execute(request)
    UC->>UC: validateRequest(request)

    UC->>Classifier: classify(transaction, mainCategory)
    Classifier->>Matcher: match(description)
    Matcher->>Matcher: normalizeText("スターバックス 表参道店")
    Note over Matcher: 正規化: 店舗名のみ抽出<br/>"スターバックス"

    Matcher->>MerchantRepo: findByName("スターバックス")
    MerchantRepo->>DB: SELECT * FROM merchants<br/>WHERE name = 'スターバックス'<br/>OR aliases LIKE '%スターバックス%'
    DB-->>MerchantRepo: MerchantOrmEntity
    MerchantRepo-->>Matcher: Merchant

    Matcher-->>Classifier: Merchant(confidence: 0.98)

    Classifier->>SubcatRepo: findById(merchant.defaultSubcategoryId)
    Note over Classifier,SubcatRepo: defaultSubcategoryId: "food_cafe"
    SubcatRepo->>DB: SELECT * FROM subcategories<br/>WHERE id = 'food_cafe'
    DB-->>SubcatRepo: SubcategoryOrmEntity
    SubcatRepo-->>Classifier: Subcategory(name: "カフェ")

    Classifier->>Classifier: createClassification(<br/>  subcategoryId: "food_cafe",<br/>  confidence: 0.98,<br/>  reason: MERCHANT_MATCH<br/>)
    Classifier-->>UC: SubcategoryClassification

    UC->>UC: createResult(classification)
    UC-->>API: ClassificationResult(success: true)
    API-->>TxSvc: 200 OK + ClassificationResponseDto

    TxSvc->>TxSvc: 取引データにサブカテゴリを設定
    Note over TxSvc: subcategory_id: "food_cafe"<br/>classification_confidence: 0.98<br/>merchant_id: "merchant_002"
```

---

## 詳細費目自動分類フロー（キーワードマッチング）

### キーワードからサブカテゴリを推測（店舗マスタに無い場合）

```mermaid
sequenceDiagram
    actor System
    participant TxSvc as TransactionService
    participant API as Backend API<br/>(SubcategoryController)
    participant UC as ClassifySubcategoryUseCase
    participant Classifier as SubcategoryClassifierService
    participant Matcher as MerchantMatcher
    participant KeywordMatcher as KeywordMatcher
    participant SubcatRepo as SubcategoryRepository
    participant DB as MySQL Database

    System->>TxSvc: 取引データ受信
    Note over System,TxSvc: description: "新宿駅 定期券購入"<br/>amount: -10000<br/>mainCategory: EXPENSE

    TxSvc->>API: POST /api/subcategories/classify
    API->>UC: execute(request)
    UC->>Classifier: classify(transaction, mainCategory)

    Classifier->>Matcher: match("新宿駅 定期券購入")
    Matcher->>Matcher: 店舗マスタ検索
    Matcher-->>Classifier: null (店舗マスタに無し)

    Classifier->>KeywordMatcher: match(description, mainCategory)
    KeywordMatcher->>KeywordMatcher: extractKeywords("新宿駅 定期券購入")
    Note over KeywordMatcher: キーワード抽出:<br/>["定期券", "駅", "新宿"]

    KeywordMatcher->>SubcatRepo: findByCategory(EXPENSE)
    SubcatRepo->>DB: SELECT * FROM subcategories<br/>WHERE category_type = 'EXPENSE'
    DB-->>SubcatRepo: SubcategoryOrmEntity[]
    SubcatRepo-->>KeywordMatcher: Subcategory[]

    KeywordMatcher->>KeywordMatcher: calculateMatchScore(keywords, subcategories)
    Note over KeywordMatcher: マッチングスコア計算:<br/>交通費 - 電車・バス: 0.85 ⭐<br/>交通費 - タクシー: 0.20<br/>その他支出: 0.10

    KeywordMatcher-->>Classifier: Subcategory(id: "transport_train_bus")

    Classifier->>Classifier: createClassification(<br/>  subcategoryId: "transport_train_bus",<br/>  confidence: 0.80,<br/>  reason: KEYWORD_MATCH<br/>)
    Classifier-->>UC: SubcategoryClassification

    UC-->>API: ClassificationResult(success: true)
    API-->>TxSvc: 200 OK + ClassificationResponseDto

    TxSvc->>TxSvc: 取引データにサブカテゴリを設定
    Note over TxSvc: subcategory_id: "transport_train_bus"<br/>classification_confidence: 0.80<br/>merchant_id: null
```

---

## 取引データへのサブカテゴリ適用フロー

### 新規取引受信時の自動分類

```mermaid
sequenceDiagram
    actor ExternalAPI as 外部金融機関API
    participant TxFetch as FetchTransactionsUseCase
    participant MainClassifier as MainCategoryClassifier<br/>(FR-008)
    participant SubClassifier as SubcategoryClassifierService<br/>(FR-009)
    participant TxRepo as TransactionRepository
    participant SubcatRepo as SubcategoryRepository
    participant MerchantRepo as MerchantRepository
    participant DB as MySQL Database

    ExternalAPI->>TxFetch: 取引データ配信
    Note over ExternalAPI,TxFetch: 新規取引100件

    loop 各取引ごと
        TxFetch->>MainClassifier: classify(transaction)
        MainClassifier-->>TxFetch: CategoryType.EXPENSE
        Note over TxFetch,MainClassifier: FR-008の主カテゴリ分類

        TxFetch->>SubClassifier: classify(transaction, mainCategory)

        SubClassifier->>MerchantRepo: 店舗マスタ検索
        MerchantRepo-->>SubClassifier: Merchant|null

        alt 店舗マスタにヒット
            SubClassifier->>SubcatRepo: findById(merchant.defaultSubcategoryId)
            SubcatRepo-->>SubClassifier: Subcategory
            SubClassifier-->>TxFetch: Classification(confidence: 0.95)
        else 店舗マスタに無し
            SubClassifier->>SubClassifier: キーワードマッチング
            SubClassifier->>SubcatRepo: findByCategory(mainCategory)
            SubcatRepo-->>SubClassifier: Subcategory[]
            SubClassifier-->>TxFetch: Classification(confidence: 0.70)
        end

        TxFetch->>TxFetch: Transactionエンティティ作成
        Note over TxFetch: subcategory_id<br/>classification_confidence<br/>merchant_id

        TxFetch->>TxRepo: save(transaction)
        TxRepo->>DB: INSERT INTO transactions<br/>(id, subcategory_id, classification_confidence, ...)
        DB-->>TxRepo: void
    end

    TxFetch-->>ExternalAPI: 処理完了（100件）
```

---

## 店舗マスタ登録フロー

### 新しい店舗をマスタに追加（管理者機能）

```mermaid
sequenceDiagram
    actor Admin as 管理者
    participant UI as Admin UI
    participant API as Backend API<br/>(MerchantController)
    participant UC as CreateMerchantUseCase
    participant MerchantRepo as MerchantRepository
    participant SubcatRepo as SubcategoryRepository
    participant DB as MySQL Database

    Admin->>UI: 店舗マスタ管理画面を開く
    UI->>Admin: 登録フォーム表示

    Admin->>UI: 店舗情報入力
    Note over Admin,UI: 店舗名: "ローソン"<br/>別名: ["LAWSON", "lawson"]<br/>デフォルト費目: 食費-食料品

    UI->>API: POST /api/merchants
    Note over UI,API: CreateMerchantDto

    API->>UC: execute(dto)
    UC->>UC: validateDto(dto)

    UC->>MerchantRepo: findByName("ローソン")
    MerchantRepo->>DB: SELECT * FROM merchants<br/>WHERE name = 'ローソン'
    DB-->>MerchantRepo: null
    MerchantRepo-->>UC: null (重複なし)

    UC->>SubcatRepo: findById("food_groceries")
    SubcatRepo->>DB: SELECT * FROM subcategories<br/>WHERE id = 'food_groceries'
    DB-->>SubcatRepo: SubcategoryOrmEntity
    SubcatRepo-->>UC: Subcategory(name: "食料品")

    UC->>UC: Merchantエンティティ作成
    UC->>MerchantRepo: save(merchant)
    MerchantRepo->>DB: INSERT INTO merchants<br/>(id, name, aliases, default_subcategory_id, ...)
    DB-->>MerchantRepo: void
    MerchantRepo-->>UC: Merchant

    UC-->>API: MerchantResult(success: true)
    API-->>UI: 201 Created + MerchantDto
    UI->>Admin: 成功メッセージ表示
    Admin->>UI: 店舗マスタ一覧を確認
```

---

## エラー処理フロー

### サブカテゴリが見つからない場合

```mermaid
sequenceDiagram
    participant System
    participant Classifier as SubcategoryClassifierService
    participant SubcatRepo as SubcategoryRepository
    participant DB as MySQL Database

    System->>Classifier: classify(transaction, mainCategory)

    Classifier->>Classifier: 全ての分類ロジック試行
    Note over Classifier: 1. 店舗マスタ照合 → 失敗<br/>2. キーワードマッチ → 失敗<br/>3. 金額推測 → 失敗<br/>4. 定期性判定 → 失敗

    Classifier->>SubcatRepo: findDefault(mainCategory)
    Note over Classifier,SubcatRepo: デフォルト費目を取得:<br/>EXPENSE → "その他支出"

    SubcatRepo->>DB: SELECT * FROM subcategories<br/>WHERE category_type = 'EXPENSE'<br/>AND name = 'その他'<br/>AND parent_id IS NULL
    DB-->>SubcatRepo: SubcategoryOrmEntity
    SubcatRepo-->>Classifier: Subcategory(id: "other_expense")

    Classifier->>Classifier: createClassification(<br/>  subcategoryId: "other_expense",<br/>  confidence: 0.50,<br/>  reason: DEFAULT<br/>)
    Classifier-->>System: SubcategoryClassification

    Note over System: 低信頼度のため手動確認推奨フラグを設定
```

---

## パフォーマンス最適化

### 店舗マスタのキャッシュ利用

```mermaid
sequenceDiagram
    participant Classifier as SubcategoryClassifierService
    participant Cache as MerchantCache<br/>(In-Memory)
    participant MerchantRepo as MerchantRepository
    participant DB as MySQL Database

    Classifier->>Cache: get("スターバックス")

    alt キャッシュヒット
        Cache-->>Classifier: Merchant(from cache)
        Note over Cache,Classifier: キャッシュから即座に返却<br/>（1ms未満）
    else キャッシュミス
        Cache-->>Classifier: null
        Classifier->>MerchantRepo: findByName("スターバックス")
        MerchantRepo->>DB: SELECT ...
        DB-->>MerchantRepo: MerchantOrmEntity
        MerchantRepo-->>Classifier: Merchant

        Classifier->>Cache: set("スターバックス", merchant)
        Note over Classifier,Cache: 次回以降のために<br/>キャッシュに保存（TTL: 1時間）
    end
```

---

## 注意事項

### 並行処理

- バッチ分類時は複数トランザクションを並行処理
- 店舗マスタとサブカテゴリマスタはイミュータブルとして扱う

### トランザクション管理

- 取引データへのサブカテゴリ適用はトランザクション内で実行
- ロールバック時はサブカテゴリ情報もクリア

### キャッシュ戦略

- 店舗マスタ: インメモリキャッシュ（1時間TTL）
- サブカテゴリマスタ: アプリケーション起動時にロード

---

## 参考資料

- [README.md](./README.md) - 設計書の概要
- [class-diagrams.md](./class-diagrams.md) - クラス構造
- [input-output-design.md](./input-output-design.md) - API仕様
