# シーケンス図 - FR-008-011: 取引データの主要カテゴリ自動分類

## 正常系: 分類リクエストの全体フロー

### 金融機関タイプによる分類（信頼度: high）

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant UI as CategoryClassifier
    participant API as TransactionController
    participant UC as ClassifyTransactionUseCase
    participant Service as CategoryClassificationService
    participant Repo as CategoryRepository

    User->>UI: 金額・説明を入力
    User->>UI: 「カテゴリを自動分類」クリック
    UI->>API: POST /api/transactions/classify
    Note over API: ValidationPipeで入力検証
    API->>UC: execute(dto)
    UC->>Service: classifyTransaction(transaction, institutionType)

    alt 金融機関タイプが'securities'
        Service->>Service: classifyByInstitutionType('securities')
        Service-->>UC: { category: INVESTMENT, confidence: 0.9, confidenceLevel: 'high', reason: '証券口座' }
    end

    UC->>Repo: findByType(INVESTMENT)
    Repo-->>UC: [investmentCategory]
    UC->>UC: getDefaultCategoryForType(INVESTMENT)
    UC-->>API: { category: {...}, confidence: 0.9, confidenceLevel: 'high', reason: '証券口座' }
    API-->>UI: { success: true, data: {...} }
    UI->>UI: 結果を表示（高信頼度）
    UI-->>User: 分類結果を表示
```

---

## 正常系: キーワードマッチングによる分類（信頼度: medium）

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant UI as CategoryClassifier
    participant API as TransactionController
    participant UC as ClassifyTransactionUseCase
    participant Service as CategoryClassificationService
    participant Repo as CategoryRepository

    User->>UI: 金額: 300000, 説明: "給与振込"
    User->>UI: 「カテゴリを自動分類」クリック
    UI->>API: POST /api/transactions/classify
    Note over API: バリデーション成功
    API->>UC: execute({ amount: 300000, description: '給与振込' })
    UC->>Service: classifyTransaction(transaction)

    Service->>Service: classifyByInstitutionType() → null
    Service->>Service: matchKeywords('給与振込')

    loop カテゴリごとにキーワードチェック
        alt '給与'がINCOMEキーワードに一致
            Service->>Service: カテゴリをINCOMEに決定
        end
    end

    Service->>Service: evaluateConfidence(0.7)
    Service-->>UC: { category: INCOME, confidence: 0.7, confidenceLevel: 'medium', reason: 'キーワード...' }

    UC->>Repo: findByType(INCOME)
    Repo-->>UC: [給与所得カテゴリ]
    UC->>UC: getDefaultCategoryForType(INCOME)
    UC->>UC: orderでソート → 最初の要素を選択
    UC-->>API: { category: { id: 'income-salary', name: '給与所得', type: INCOME }, ... }
    API-->>UI: { success: true, data: {...} }
    UI->>UI: 結果を表示（中信頼度）
    UI-->>User: 分類結果を表示
```

---

## 正常系: 金額ベース分類（信頼度: low）

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant UI as CategoryClassifier
    participant API as TransactionController
    participant UC as ClassifyTransactionUseCase
    participant Service as CategoryClassificationService
    participant Repo as CategoryRepository

    User->>UI: 金額: -1000, 説明: "xxx"
    User->>UI: 「カテゴリを自動分類」クリック
    UI->>API: POST /api/transactions/classify
    API->>UC: execute({ amount: -1000, description: 'xxx' })
    UC->>Service: classifyTransaction(transaction)

    Service->>Service: classifyByInstitutionType() → null
    Service->>Service: matchKeywords('xxx') → null
    Service->>Service: classifyByAmount(-1000)

    alt amount < 0
        Service->>Service: カテゴリをEXPENSEに決定
    end

    Service->>Service: evaluateConfidence(0.3)
    Service-->>UC: { category: EXPENSE, confidence: 0.3, confidenceLevel: 'low', reason: '金額ベース...' }

    UC->>Repo: findByType(EXPENSE)
    Repo-->>UC: [支出カテゴリ]
    UC->>UC: getDefaultCategoryForType(EXPENSE)
    UC-->>API: { category: {...}, confidence: 0.3, confidenceLevel: 'low', reason: '金額ベース...' }
    API-->>UI: { success: true, data: {...} }
    UI->>UI: 結果を表示（低信頼度）
    UI-->>User: 分類結果を表示
```

---

## 正常系: キーワード評価順序による正しい分類

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Service as CategoryClassificationService

    User->>Service: classifyTransaction({ description: '住宅ローン振込' })

    Service->>Service: matchKeywords('住宅ローン振込')

    Note over Service: 評価順序: REPAYMENT → INVESTMENT → TRANSFER → INCOME → EXPENSE

    Service->>Service: REPAYMENTキーワードをチェック
    Note over Service: '住宅ローン'が一致
    Service->>Service: カテゴリをREPAYMENTに決定
    Note over Service: INCOMEの'振込'より前に検出

    Service->>Service: evaluateConfidence(0.7)
    Service-->>User: { category: REPAYMENT, confidence: 0.7, confidenceLevel: 'medium', reason: 'キーワード...' }
```

---

## 異常系: バリデーションエラー

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant UI as CategoryClassifier
    participant API as TransactionController

    User->>UI: 金額・説明を未入力
    User->>UI: 「カテゴリを自動分類」クリック

    alt クライアント側バリデーション
        UI->>UI: 入力チェック
        UI-->>User: エラーメッセージ表示<br/>"金額と説明を入力してください"
    else サーバー側バリデーション
        UI->>API: POST /api/transactions/classify<br/>{ amount: null, description: '' }
        Note over API: ValidationPipe実行
        API->>API: class-validatorでエラー検出
        API-->>UI: 400 Bad Request<br/>{ statusCode: 400, message: [...], error: 'Bad Request' }
        UI->>UI: エラーメッセージ表示
        UI-->>User: "エラーが発生しました"
    end
```

---

## 異常系: カテゴリが見つからない

```mermaid
sequenceDiagram
    participant UC as ClassifyTransactionUseCase
    participant Service as CategoryClassificationService
    participant Repo as CategoryRepository

    UC->>Service: classifyTransaction(transaction)
    Service-->>UC: { category: INCOME, ... }

    UC->>Repo: findByType(INCOME)
    Repo-->>UC: [] (空配列)

    UC->>UC: getDefaultCategoryForType(INCOME)

    alt カテゴリが見つからない
        UC->>UC: デフォルト値を生成
        Note over UC: id: 'default-INCOME'<br/>name: '収入'<br/>type: INCOME
    end

    UC-->>UC: デフォルトカテゴリを返却
```

---

## E2Eテストフロー

```mermaid
sequenceDiagram
    participant Test as Playwright Test
    participant Page as Browser
    participant Frontend as Next.js
    participant Backend as NestJS API

    Test->>Page: page.goto('/classification')
    Page->>Frontend: GET /classification
    Frontend-->>Page: 分類ページ表示

    Test->>Page: page.getByLabel('金額').fill('300000')
    Test->>Page: page.getByLabel('説明').fill('給与振込')
    Test->>Page: page.getByRole('button', { name: 'カテゴリを自動分類' }).click()

    Page->>Frontend: ボタンクリックイベント
    Frontend->>Backend: POST /api/transactions/classify
    Backend->>Backend: 分類処理実行
    Backend-->>Frontend: { success: true, data: {...} }
    Frontend->>Page: 結果を描画

    Test->>Page: expect(page.getByText('分類結果')).toBeVisible()
    Test->>Page: expect(page.getByText('収入').first()).toBeVisible()
    Test->>Page: expect(page.getByText(/信頼度/)).toBeVisible()

    Page-->>Test: テスト成功
```

---

## 処理時間とパフォーマンス

### 分類処理の時間計測

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant UseCase
    participant Service
    participant DB

    Note over Client,DB: 想定処理時間

    Client->>API: リクエスト送信
    Note over API: <10ms (バリデーション)

    API->>UseCase: execute()
    Note over UseCase: <5ms

    UseCase->>Service: classifyTransaction()
    Note over Service: <5ms (インメモリ処理)

    UseCase->>DB: findByType()
    Note over DB: <20ms (インデックス利用)

    DB-->>UseCase: カテゴリ取得
    UseCase-->>API: 分類結果
    API-->>Client: レスポンス返却

    Note over Client,DB: 合計: 約40ms以下
```

---

## チェックリスト

- [x] 正常系の主要フローを記載
- [x] 金融機関タイプによる分類フロー
- [x] キーワードマッチングによる分類フロー
- [x] 金額ベース分類フロー
- [x] キーワード評価順序の説明
- [x] 異常系のフロー（バリデーションエラー）
- [x] 異常系のフロー（カテゴリ未検出）
- [x] E2Eテストフロー
- [x] パフォーマンス計測の考慮
- [x] エラーハンドリングの記載
