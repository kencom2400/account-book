# シーケンス図

このドキュメントでは、金融機関連携機能の主要な処理フローをシーケンス図で記載しています。

## 目次

1. [金融機関連携フロー (FR-001)](#金融機関連携フロー-fr-001)
2. [クレジットカード連携フロー (FR-002)](#クレジットカード連携フロー-fr-002)
3. [証券会社連携フロー (FR-003)](#証券会社連携フロー-fr-003)
4. [バックグラウンド接続確認フロー (FR-004)](#バックグラウンド接続確認フロー-fr-004)
5. [接続失敗通知フロー (FR-005)](#接続失敗通知フロー-fr-005)

---

## 金融機関連携フロー (FR-001)

### 銀行口座連携

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend<br/>(BankSelector)
    participant Form as BankCredentialsForm
    participant API as Backend API<br/>(InstitutionController)
    participant UC as ConnectInstitutionUseCase
    participant Encrypt as EncryptionService
    participant BankAPI as BankApiAdapter
    participant Repo as InstitutionRepository
    participant Storage as FileStorageService

    User->>UI: 銀行追加ボタンクリック
    UI->>User: 銀行一覧表示
    User->>UI: 銀行選択
    UI->>Form: 選択した銀行を渡す
    Form->>User: 認証情報入力フォーム表示

    User->>Form: 認証情報入力
    Note over User,Form: 銀行コード、支店コード、<br/>口座番号、APIキー

    Form->>Form: バリデーション実行
    alt バリデーションエラー
        Form->>User: エラーメッセージ表示
    end

    Form->>API: POST /api/institutions
    Note over Form,API: ConnectInstitutionDto

    API->>UC: execute(dto)
    UC->>Encrypt: encrypt(credentials)
    Encrypt-->>UC: EncryptedCredentials

    UC->>BankAPI: testConnection(credentials)
    BankAPI->>BankAPI: 外部銀行APIに接続テスト

    alt 接続成功
        BankAPI-->>UC: true
        UC->>BankAPI: fetchAccounts(credentials)
        BankAPI-->>UC: Account[]

        UC->>UC: InstitutionEntityを作成
        UC->>Repo: save(institution)
        Repo->>Storage: write('institutions.json', data)
        Storage-->>Repo: void
        Repo-->>UC: InstitutionEntity

        UC-->>API: InstitutionEntity
        API-->>Form: 200 OK + InstitutionResponse
        Form->>User: 成功メッセージ表示
        Form->>UI: ダッシュボードへ遷移

    else 接続失敗
        BankAPI-->>UC: false (エラー詳細)
        UC-->>API: InstitutionConnectionError
        API-->>Form: 400 Bad Request + ErrorResponse
        Form->>User: エラーメッセージ表示
        Note over Form,User: 認証エラー/タイムアウト/<br/>APIエラーなど
    end
```

---

## クレジットカード連携フロー (FR-002)

### クレジットカード連携と利用明細取得

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend
    participant API as Backend API<br/>(CreditCardController)
    participant UC as ConnectCreditCardUseCase
    participant Encrypt as EncryptionService
    participant CardAPI as CreditCardApiAdapter
    participant Repo as CreditCardRepository
    participant Storage as FileStorageService

    User->>UI: カード追加ボタンクリック
    UI->>User: カード会社一覧表示
    User->>UI: カード会社選択
    UI->>User: 認証情報入力フォーム表示

    User->>UI: 認証情報入力
    Note over User,UI: カード番号、有効期限、<br/>カード名義、ログイン情報

    UI->>UI: バリデーション実行
    Note over UI: Luhnアルゴリズムで<br/>カード番号検証

    UI->>API: POST /api/credit-cards
    Note over UI,API: ConnectCreditCardDto

    API->>UC: execute(dto)

    UC->>UC: カード番号から下4桁のみ抽出
    UC->>Encrypt: encrypt(credentials)
    Encrypt-->>UC: EncryptedCredentials

    UC->>CardAPI: testConnection(credentials)
    CardAPI->>CardAPI: 外部カード会社APIに接続

    alt 接続成功
        CardAPI-->>UC: true

        UC->>CardAPI: fetchCardInfo(credentials)
        CardAPI-->>UC: CardInfo

        UC->>CardAPI: fetchTransactions(credentials, -3months, now)
        Note over CardAPI: 過去3ヶ月分の<br/>利用明細を取得
        CardAPI-->>UC: Transaction[]

        UC->>UC: CreditCardEntityを作成
        UC->>Repo: save(creditCard)
        Repo->>Storage: write('credit-cards.json', data)
        Storage-->>Repo: void
        Repo-->>UC: CreditCardEntity

        UC-->>API: CreditCardEntity
        API-->>UI: 200 OK + CreditCardResponse
        UI->>User: 成功メッセージ表示
        UI->>UI: ダッシュボードへ遷移

    else 接続失敗
        CardAPI-->>UC: false (エラー詳細)
        UC-->>API: CreditCardConnectionError
        API-->>UI: 400 Bad Request + ErrorResponse
        UI->>User: エラーメッセージ表示
    end
```

---

## 証券会社連携フロー (FR-003)

### 証券口座連携と保有銘柄取得

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend
    participant API as Backend API<br/>(SecuritiesController)
    participant UC as ConnectSecuritiesAccountUseCase
    participant Encrypt as EncryptionService
    participant SecAPI as SecuritiesApiAdapter
    participant Repo as SecuritiesAccountRepository
    participant Storage as FileStorageService

    User->>UI: 証券追加ボタンクリック
    UI->>User: 証券会社一覧表示
    User->>UI: 証券会社選択
    UI->>User: 認証情報入力フォーム表示

    User->>UI: 認証情報入力
    Note over User,UI: ログインID、パスワード、<br/>取引暗証番号、口座種別

    UI->>API: POST /api/securities-accounts
    Note over UI,API: ConnectSecuritiesAccountDto

    API->>UC: execute(dto)
    UC->>Encrypt: encrypt(credentials)
    Encrypt-->>UC: EncryptedCredentials

    UC->>SecAPI: testConnection(credentials)
    SecAPI->>SecAPI: 外部証券会社APIに接続

    alt 接続成功
        SecAPI-->>UC: true

        UC->>SecAPI: fetchAccountInfo(credentials)
        SecAPI-->>UC: AccountInfo
        Note over SecAPI: 口座番号、評価額合計、<br/>現金残高など

        UC->>SecAPI: fetchPortfolio(credentials)
        SecAPI-->>UC: Portfolio[]
        Note over SecAPI: 保有銘柄情報

        UC->>UC: SecuritiesAccountEntityを作成
        UC->>Repo: save(securitiesAccount)
        Repo->>Storage: write('securities-accounts.json', data)
        Storage-->>Repo: void
        Repo-->>UC: SecuritiesAccountEntity

        UC-->>API: SecuritiesAccountEntity
        API-->>UI: 200 OK + SecuritiesAccountResponse
        UI->>User: 成功メッセージ表示
        UI->>UI: ダッシュボードへ遷移

    else 接続失敗
        SecAPI-->>UC: false (エラー詳細)
        UC-->>API: SecuritiesConnectionError
        API-->>UI: 400 Bad Request + ErrorResponse
        UI->>User: エラーメッセージ表示
    end
```

---

## バックグラウンド接続確認フロー (FR-004)

### アプリ起動時の接続確認

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend
    participant API as Backend API<br/>(HealthController)
    participant UC as CheckConnectionStatusUseCase
    participant Aggregation as InstitutionAggregationService
    participant Checker as ConnectionCheckerService
    participant BankAPI as BankApiAdapter
    participant CardAPI as CreditCardApiAdapter
    participant SecAPI as SecuritiesApiAdapter
    participant HistoryRepo as ConnectionHistoryRepository
    participant Storage as FileStorageService

    User->>UI: アプリ起動
    UI->>UI: 初期化処理

    par バックグラウンド処理開始
        UI->>API: GET /api/health/check-all

        API->>UC: execute()
        UC->>Aggregation: getAllInstitutions()
        Aggregation-->>UC: {banks, cards, securities}

        par 並列接続確認
            UC->>Checker: checkInstitution(bank1)
            Checker->>BankAPI: testConnection()
            BankAPI-->>Checker: ConnectionCheckResultVO
            Checker-->>UC: Result1

            UC->>Checker: checkCreditCard(card1)
            Checker->>CardAPI: testConnection()
            CardAPI-->>Checker: ConnectionCheckResultVO
            Checker-->>UC: Result2

            UC->>Checker: checkSecuritiesAccount(sec1)
            Checker->>SecAPI: testConnection()
            SecAPI-->>Checker: ConnectionCheckResultVO
            Checker-->>UC: Result3
        end

        UC->>UC: 全ての結果を集約

        loop 各結果に対して
            UC->>HistoryRepo: save(ConnectionHistory)
            HistoryRepo->>Storage: write('connection-history.json')
            Storage-->>HistoryRepo: void
        end

        UC-->>API: ConnectionCheckResultVO[]
        API-->>UI: 200 OK + ConnectionStatusResponse[]

        alt エラーが存在する
            API->>API: FR-005通知トリガー
            Note over API: NotificationServiceへ
        end

        UI->>UI: 接続状態表示を更新
        UI->>User: ダッシュボード表示
    end
```

### 手動同期

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend
    participant API as Backend API<br/>(HealthController)
    participant UC as CheckConnectionStatusUseCase

    User->>UI: 手動同期ボタンクリック
    UI->>User: 同期中インジケーター表示

    UI->>API: GET /api/health/check-all
    API->>UC: execute()
    Note over UC: バックグラウンド確認と<br/>同じフロー
    UC-->>API: ConnectionCheckResultVO[]
    API-->>UI: 200 OK + Response

    UI->>UI: 同期完了メッセージ表示
    UI->>UI: 接続状態を更新
    UI->>User: 最新の接続状態を表示
```

---

## 接続失敗通知フロー (FR-005)

### エラー検出と通知表示

```mermaid
sequenceDiagram
    participant Checker as ConnectionCheckerService
    participant History as ConnectionHistory
    participant Notif as NotificationService
    participant UI as Frontend
    participant Modal as ErrorModal
    participant Toast as ErrorToast

    Checker->>Checker: 接続失敗検出
    Checker->>History: エラー情報を記録

    Checker->>Notif: notifyConnectionFailure(error)

    Notif->>Notif: エラー種別を分析

    alt 認証エラー
        Notif->>Notif: 優先度: 高
        Notif->>Notif: 通知タイプ: Modal
        Notif->>UI: 通知イベント送信
        UI->>Modal: エラーモーダル表示
        Modal->>Modal: エラー内容表示
        Note over Modal: "認証情報が無効です<br/>再度認証してください"
        Modal->>Modal: アクションボタン表示
        Note over Modal: [設定を開く] [後で]

    else タイムアウト/APIエラー
        Notif->>Notif: 優先度: 中
        Notif->>Notif: 通知タイプ: Toast
        Notif->>UI: 通知イベント送信
        UI->>Toast: トースト通知表示
        Toast->>Toast: エラー内容表示
        Note over Toast: "データ取得失敗<br/>時間をおいて再試行"
        Toast->>Toast: アクションボタン表示
        Note over Toast: [再試行] [閉じる]

    else 複数金融機関でエラー
        Notif->>Notif: 優先度: 高
        Notif->>Notif: 通知タイプ: Modal
        Notif->>UI: 通知イベント送信
        UI->>Modal: エラーモーダル表示
        Modal->>Modal: エラー一覧表示
        Note over Modal: "3件の金融機関で<br/>エラー発生"
        Modal->>Modal: エラー詳細リスト表示
        Modal->>Modal: アクションボタン表示
        Note over Modal: [詳細確認] [閉じる]
    end
```

### ユーザーアクション処理

```mermaid
sequenceDiagram
    actor User
    participant Modal as ErrorModal
    participant UI as Frontend
    participant API as Backend API
    participant Settings as 設定画面

    Modal->>User: エラー通知表示

    alt ユーザーが「設定を開く」を選択
        User->>Modal: 設定ボタンクリック
        Modal->>UI: 設定画面へ遷移リクエスト
        UI->>Settings: 設定画面表示
        Settings->>User: エラーが発生した金融機関を強調表示
        User->>Settings: 金融機関を選択
        Settings->>User: 認証情報編集フォーム表示
        User->>Settings: 認証情報を更新
        Settings->>API: PUT /api/institutions/:id
        API-->>Settings: 200 OK
        Settings->>User: 更新完了メッセージ

    else ユーザーが「再試行」を選択
        User->>Modal: 再試行ボタンクリック
        Modal->>API: GET /api/health/check/:id
        API->>API: 接続テスト実行

        alt 再試行成功
            API-->>Modal: 200 OK (接続成功)
            Modal->>User: 成功メッセージ表示
            Modal->>UI: モーダルを閉じる
        else 再試行失敗
            API-->>Modal: 400 Bad Request
            Modal->>User: エラーメッセージ再表示
        end

    else ユーザーが「後で」または「閉じる」を選択
        User->>Modal: 閉じるボタンクリック
        Modal->>Modal: 通知を非表示に
        Note over Modal: 次回起動時まで通知しない
        Modal->>UI: ダッシュボードへ戻る
    end
```

### 通知の重複防止

```mermaid
sequenceDiagram
    participant Notif as NotificationService
    participant Store as NotificationStore
    participant UI as Frontend

    Notif->>Store: 新しい通知を追加リクエスト
    Store->>Store: 既存通知を確認

    alt 同じエラーが24時間以内に通知済み
        Store->>Notif: 重複通知として却下
        Note over Store: スキップ
    else 未通知 or 24時間以上経過
        Store->>Store: 通知を保存
        Store->>UI: 通知表示イベント送信
        UI->>UI: 通知を表示
    end

    Note over Store: エラー解消後は<br/>自動的に通知を削除
```

---

## パフォーマンス最適化

### 並列接続確認の実装

```mermaid
sequenceDiagram
    participant UC as CheckConnectionStatusUseCase
    participant Checker as ConnectionCheckerService
    participant API1 as BankAPI 1
    participant API2 as BankAPI 2
    participant API3 as CardAPI 1
    participant API4 as SecuritiesAPI 1

    UC->>UC: 登録済み金融機関リスト取得
    Note over UC: 例: 銀行2件、カード1件、証券1件

    par 最大5件並列処理
        UC->>Checker: checkInstitution(bank1)
        Checker->>API1: testConnection()
        Note over API1: タイムアウト: 10秒

        UC->>Checker: checkInstitution(bank2)
        Checker->>API2: testConnection()

        UC->>Checker: checkCreditCard(card1)
        Checker->>API3: testConnection()

        UC->>Checker: checkSecuritiesAccount(sec1)
        Checker->>API4: testConnection()
    end

    Note over UC: 全ての接続確認が完了するまで待機<br/>（最大10秒 x 並列数）

    API1-->>Checker: Result
    API2-->>Checker: Result
    API3-->>Checker: Result
    API4-->>Checker: Result

    Checker-->>UC: All Results
    UC->>UC: 結果を集約して返却
```

---

## エラーハンドリング

### リトライロジック

```mermaid
sequenceDiagram
    participant UC as UseCase
    participant API as ExternalAPI

    UC->>API: testConnection() (1回目)
    API-->>UC: Timeout Error

    Note over UC: 5秒待機

    UC->>API: testConnection() (2回目)
    API-->>UC: Timeout Error

    Note over UC: 5秒待機

    UC->>API: testConnection() (3回目)

    alt 3回目成功
        API-->>UC: Success
    else 3回目も失敗
        API-->>UC: Final Error
        UC->>UC: エラーとして記録
        UC->>UC: FR-005通知トリガー
    end
```

---

## まとめ

このシーケンス図は、金融機関連携機能における主要な処理フローを詳細に記載しています。各フローは実際の実装に基づいており、エラーハンドリングやパフォーマンス最適化の方針も明確に示されています。
