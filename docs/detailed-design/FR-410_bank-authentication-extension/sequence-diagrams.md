# シーケンス図

このドキュメントでは、銀行認証方式の拡張機能の処理フローをシーケンス図で記載しています。

## 目次

1. [銀行追加フロー（認証方式に応じたフォーム切り替え）](#銀行追加フロー認証方式に応じたフォーム切り替え)
2. [接続テストフロー（認証方式に応じたバリデーション）](#接続テストフロー認証方式に応じたバリデーション)
3. [金融機関登録フロー（認証方式に応じた処理）](#金融機関登録フロー認証方式に応じた処理)
4. [対応銀行一覧取得フロー（認証タイプ情報を含む）](#対応銀行一覧取得フロー認証タイプ情報を含む)

---

## 銀行追加フロー（認証方式に応じたフォーム切り替え）

### 概要

**ユースケース**: ユーザーが銀行を追加する際、選択した銀行の認証方式に応じて適切な入力フォームを表示する

**アクター**: ユーザー

**前提条件**:

- ユーザーがログインしている
- 対応銀行一覧が取得済み

**成功時の結果**:

- 認証方式に応じた入力フォームが表示される
- ユーザーが認証情報を入力できる

### 正常系フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Page as AddBankPage
    participant Selector as BankSelector
    participant API as Backend API<br/>(InstitutionController)
    participant UC as GetSupportedBanksUseCase
    participant Form as BankCredentialsForm
    participant BranchForm as BranchAccountForm
    participant UserPassForm as UserIdPasswordForm

    User->>Page: 銀行追加ボタンクリック
    Page->>API: GET /api/institutions/supported-banks
    API->>UC: execute(query)
    UC-->>API: Bank[]<br/>(authenticationType含む)
    API-->>Page: 200 OK<br/>{banks: Bank[]}

    Page->>Selector: 銀行一覧を渡す
    Selector->>User: 銀行一覧表示

    User->>Selector: 銀行選択（例: 三菱UFJ銀行）
    Selector->>Page: 選択した銀行を返す

    Page->>Page: 選択した銀行の<br/>authenticationTypeを確認

    alt authenticationType === BRANCH_ACCOUNT
        Page->>Form: 銀行情報を渡す<br/>(authenticationType: BRANCH_ACCOUNT)
        Form->>BranchForm: 支店コード＋口座番号フォーム表示
        BranchForm->>User: 支店コード、口座番号、<br/>APIキー、APIシークレット入力欄

    else authenticationType === USERID_PASSWORD
        Page->>Form: 銀行情報を渡す<br/>(authenticationType: USERID_PASSWORD)
        Form->>UserPassForm: ユーザID＋パスワードフォーム表示
        UserPassForm->>User: ユーザID、パスワード入力欄
    end
```

### ステップ詳細

1. **銀行一覧取得**
   - エンドポイント: `GET /api/institutions/supported-banks`
   - レスポンス: `Bank[]`（各銀行に`authenticationType`フィールドを含む）

2. **銀行選択**
   - ユーザーが銀行を選択
   - 選択した銀行の`authenticationType`を確認

3. **フォーム切り替え**
   - `BRANCH_ACCOUNT`: `BranchAccountForm`を表示（支店コード、口座番号、APIキー、APIシークレット）
   - `USERID_PASSWORD`: `UserIdPasswordForm`を表示（ユーザID、パスワード）

4. **認証情報入力**
   - 認証方式に応じたフィールドのみが表示される
   - 不要なフィールドは表示されない

---

## 接続テストフロー（認証方式に応じたバリデーション）

### 概要

**ユースケース**: ユーザーが入力した認証情報で銀行接続テストを実行する。認証方式に応じたバリデーションを実施する

**アクター**: ユーザー

**前提条件**:

- 銀行が選択されている
- 認証情報が入力されている

**成功時の結果**:

- 接続テストが成功し、口座情報が取得できる
- エラーの場合は適切なエラーメッセージが表示される

### 正常系フロー（支店コード＋口座番号認証）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Form as BankCredentialsForm
    participant API as Backend API<br/>(InstitutionController)
    participant DTO as TestBankConnectionDto
    participant Validator as IsValidBankCredentialsConstraint
    participant UC as TestBankConnectionUseCase
    participant Adapter as BankApiAdapter

    User->>Form: 認証情報入力<br/>(branchCode, accountNumber)
    User->>Form: 接続テストボタンクリック

    Form->>Form: バリデーション実行<br/>(authenticationType: BRANCH_ACCOUNT)
    Note over Form: branchCode: 3桁数字<br/>accountNumber: 7桁数字

    Form->>API: POST /api/institutions/test-connection<br/>{bankCode, authenticationType,<br/>branchCode, accountNumber}

    API->>DTO: TestBankConnectionDtoに変換
    API->>Validator: validate(credentials)

    Validator->>Validator: authenticationTypeを確認
    Note over Validator: BRANCH_ACCOUNTの場合:<br/>branchCode, accountNumberをチェック

    alt バリデーション成功
        Validator-->>API: true
        API->>UC: execute(dto)

        UC->>Adapter: testConnection(credentials)

        Adapter->>Adapter: 外部銀行APIに接続テスト
        Note over Adapter: 支店コード＋口座番号で認証

        alt 接続成功
            Adapter-->>UC: BankConnectionTestResult<br/>(success: true, accountInfo)
            UC-->>API: BankConnectionTestResult
            API-->>Form: 200 OK<br/>{success: true, accountInfo}
            Form->>User: 接続成功メッセージ表示
        else 接続失敗
            Adapter-->>UC: BankConnectionTestResult<br/>(success: false, errorCode)
            UC-->>API: BankConnectionTestResult
            API-->>Form: 200 OK<br/>{success: false, errorCode}
            Form->>User: エラーメッセージ表示
        end
    else バリデーション失敗
        Validator-->>API: false
        API-->>Form: 400 Bad Request<br/>{error: "バリデーションエラー"}
        Form->>User: バリデーションエラーメッセージ表示
    end
```

### 正常系フロー（ユーザID＋パスワード認証）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Form as BankCredentialsForm
    participant API as Backend API<br/>(InstitutionController)
    participant DTO as TestBankConnectionDto
    participant Validator as IsValidBankCredentialsConstraint
    participant UC as TestBankConnectionUseCase
    participant Adapter as BankApiAdapter

    User->>Form: 認証情報入力<br/>(userId, password)
    User->>Form: 接続テストボタンクリック

    Form->>Form: バリデーション実行<br/>(authenticationType: USERID_PASSWORD)
    Note over Form: userId: 1-100文字<br/>password: 8-100文字

    Form->>API: POST /api/institutions/test-connection<br/>{bankCode, authenticationType,<br/>userId, password}

    API->>DTO: TestBankConnectionDtoに変換
    API->>Validator: validate(credentials)

    Validator->>Validator: authenticationTypeを確認
    Note over Validator: USERID_PASSWORDの場合:<br/>userId, passwordをチェック

    alt バリデーション成功
        Validator-->>API: true
        API->>UC: execute(dto)

        UC->>Adapter: testConnection(credentials)

        Adapter->>Adapter: 外部銀行APIに接続テスト
        Note over Adapter: ユーザID＋パスワードで認証

        alt 接続成功
            Adapter-->>UC: BankConnectionTestResult<br/>(success: true, accountInfo)
            UC-->>API: BankConnectionTestResult
            API-->>Form: 200 OK<br/>{success: true, accountInfo}
            Form->>User: 接続成功メッセージ表示
        else 接続失敗
            Adapter-->>UC: BankConnectionTestResult<br/>(success: false, errorCode)
            UC-->>API: BankConnectionTestResult
            API-->>Form: 200 OK<br/>{success: false, errorCode}
            Form->>User: エラーメッセージ表示
        end
    else バリデーション失敗
        Validator-->>API: false
        API-->>Form: 400 Bad Request<br/>{error: "バリデーションエラー"}
        Form->>User: バリデーションエラーメッセージ表示
    end
```

### ステップ詳細

1. **認証情報入力**
   - 認証方式に応じたフィールドに入力
   - `BRANCH_ACCOUNT`: 支店コード、口座番号、APIキー、APIシークレット
   - `USERID_PASSWORD`: ユーザID、パスワード

2. **フロントエンドバリデーション**
   - 認証方式に応じたバリデーションを実行
   - `BRANCH_ACCOUNT`: 支店コード（3桁数字）、口座番号（7桁数字）
   - `USERID_PASSWORD`: ユーザID（1-100文字）、パスワード（8-100文字）

3. **バックエンドバリデーション**
   - `IsValidBankCredentialsConstraint`で認証方式に応じたバリデーション
   - 必須フィールドの存在、型、フォーマットをチェック

4. **接続テスト実行**
   - `BankApiAdapter`で外部銀行APIに接続テスト
   - 認証方式に応じた認証情報を使用

5. **結果表示**
   - 成功: 口座情報を表示
   - 失敗: エラーメッセージを表示

## 金融機関登録フロー（認証方式に応じた処理）

### 概要

**ユースケース**: 接続テスト成功後、金融機関を登録する。認証情報は暗号化して保存する

**アクター**: ユーザー

**前提条件**:

- 接続テストが成功している
- 認証情報が入力されている

**成功時の結果**:

- 金融機関が登録される
- 認証情報が暗号化されて保存される

### 正常系フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Form as BankCredentialsForm
    participant API as Backend API<br/>(InstitutionController)
    participant DTO as CreateInstitutionDto
    participant Validator as IsValidBankCredentialsConstraint
    participant UC as CreateInstitutionUseCase
    participant Crypto as CryptoService
    participant Repo as InstitutionRepository
    participant Storage as FileStorage

    User->>Form: 金融機関登録ボタンクリック

    Form->>Form: バリデーション実行
    Form->>API: POST /api/institutions<br/>{name, type, credentials}

    API->>DTO: CreateInstitutionDtoに変換
    API->>Validator: validate(credentials)

    Validator->>Validator: authenticationTypeを確認
    Note over Validator: 認証方式に応じた<br/>必須フィールドをチェック

    alt バリデーション成功
        Validator-->>API: true
        API->>UC: execute(dto)

        UC->>Crypto: encrypt(credentials)
        Note over Crypto: AES-256-GCMで暗号化<br/>(passwordも含む)
        Crypto-->>UC: EncryptedCredentials

        UC->>UC: InstitutionEntityを作成
        Note over UC: credentials: EncryptedCredentials<br/>isConnected: true

        UC->>Repo: save(institution)
        Repo->>Storage: write('institutions.json', data)
        Storage-->>Repo: void
        Repo-->>UC: InstitutionEntity

        UC-->>API: InstitutionEntity
        API->>API: InstitutionResponseDtoに変換
        API-->>Form: 201 Created<br/>{id, name, type, isConnected}
        Form->>User: 登録成功メッセージ表示
        Form->>Form: ダッシュボードへ遷移

    else バリデーション失敗
        Validator-->>API: false
        API-->>Form: 400 Bad Request<br/>{error: "バリデーションエラー"}
        Form->>User: バリデーションエラーメッセージ表示
    end
```

### ステップ詳細

1. **金融機関登録リクエスト**
   - エンドポイント: `POST /api/institutions`
   - RequestDTO: `CreateInstitutionDto`（`credentials`に認証方式に応じたフィールドを含む）

2. **バリデーション**
   - `IsValidBankCredentialsConstraint`で認証方式に応じたバリデーション
   - 必須フィールドの存在、型、フォーマットをチェック

3. **認証情報の暗号化**
   - `CryptoService`で認証情報を暗号化（AES-256-GCM）
   - パスワードも含めて暗号化

4. **金融機関エンティティの作成**
   - `InstitutionEntity`を作成
   - `credentials`は`EncryptedCredentials`として保存

5. **データ永続化**
   - `InstitutionRepository`で保存
   - ファイルストレージまたはデータベースに保存

6. **レスポンス**
   - `InstitutionResponseDto`を返す
   - 認証情報はレスポンスに含めない（セキュリティ）

## 対応銀行一覧取得フロー（認証タイプ情報を含む）

### 概要

**ユースケース**: 対応銀行一覧を取得し、各銀行の認証タイプ情報を含めて返す

**アクター**: ユーザー（フロントエンド）

**前提条件**: なし

**成功時の結果**:

- 対応銀行一覧が取得できる
- 各銀行に`authenticationType`情報が含まれる

### 正常系フロー

```mermaid
sequenceDiagram
    participant Page as AddBankPage
    participant API as Backend API<br/>(InstitutionController)
    participant UC as GetSupportedBanksUseCase
    participant Data as SUPPORTED_BANKS

    Page->>API: GET /api/institutions/supported-banks

    API->>UC: execute(query)

    UC->>Data: 銀行マスターデータを取得
    Note over Data: 各銀行にauthenticationTypeを含む<br/>三菱UFJ: USERID_PASSWORD<br/>みずほ: USERID_PASSWORD<br/>その他: BRANCH_ACCOUNT
    Data-->>UC: Bank[]

    UC-->>API: Bank[]<br/>(authenticationType含む)
    API->>API: BankResponseDto[]に変換
    API-->>Page: 200 OK<br/>{banks: BankResponseDto[]}

    Page->>Page: 銀行一覧を表示<br/>(認証タイプ情報を保持)
```

### ステップ詳細

1. **銀行一覧取得リクエスト**
   - エンドポイント: `GET /api/institutions/supported-banks`
   - クエリパラメータ: なし（または`category`、`searchTerm`）

2. **銀行マスターデータ取得**
   - `GetSupportedBanksUseCase`で`SUPPORTED_BANKS`から取得
   - 各銀行に`authenticationType`フィールドが含まれる

3. **レスポンス**
   - `BankResponseDto[]`を返す
   - 各銀行に`authenticationType`情報が含まれる

4. **フロントエンドでの利用**
   - 銀行選択時に`authenticationType`を確認
   - 認証方式に応じたフォームを表示

---

## エラーハンドリングフロー

### 認証方式不一致エラー (400 Bad Request)

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Form as BankCredentialsForm
    participant API as Backend API
    participant Validator as IsValidBankCredentialsConstraint

    User->>Form: 認証情報入力<br/>(誤った認証方式のフィールド)
    User->>Form: 接続テストボタンクリック

    Form->>API: POST /api/institutions/test-connection<br/>{bankCode: "0005",<br/>authenticationType: "BRANCH_ACCOUNT",<br/>branchCode: "001",<br/>accountNumber: "1234567"}

    API->>Validator: validate(credentials)

    Validator->>Validator: 銀行マスターデータから<br/>正しい認証タイプを取得
    Note over Validator: 三菱UFJ銀行(0005)は<br/>USERID_PASSWORDが正しい

    Validator->>Validator: 認証方式不一致を検出
    Validator-->>API: false<br/>(エラー: "認証方式が一致しません")

    API-->>Form: 400 Bad Request<br/>{error: "認証方式が一致しません"}
    Form->>User: エラーメッセージ表示
```

### 必須フィールド欠如エラー (400 Bad Request)

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Form as BankCredentialsForm
    participant API as Backend API
    participant Validator as IsValidBankCredentialsConstraint

    User->>Form: 認証情報入力<br/>(必須フィールドが欠如)
    User->>Form: 接続テストボタンクリック

    Form->>Form: バリデーション実行
    Note over Form: USERID_PASSWORDの場合:<br/>userIdまたはpasswordが欠如

    alt フロントエンドバリデーションで検出
        Form->>User: バリデーションエラーメッセージ表示
    else バックエンドバリデーションで検出
        Form->>API: POST /api/institutions/test-connection<br/>{bankCode, authenticationType,<br/>userId: "", password: ""}

        API->>Validator: validate(credentials)
        Validator->>Validator: 必須フィールドチェック
        Note over Validator: USERID_PASSWORDの場合:<br/>userId, passwordが必須

        Validator-->>API: false<br/>(エラー: "userIdとpasswordは必須です")
        API-->>Form: 400 Bad Request<br/>{error: "userIdとpasswordは必須です"}
        Form->>User: エラーメッセージ表示
    end
```

### 接続テスト失敗エラー (200 OK with error)

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Form as BankCredentialsForm
    participant API as Backend API
    participant UC as TestBankConnectionUseCase
    participant Adapter as BankApiAdapter

    User->>Form: 認証情報入力<br/>(誤った認証情報)
    User->>Form: 接続テストボタンクリック

    Form->>API: POST /api/institutions/test-connection<br/>{credentials}

    API->>UC: execute(dto)
    UC->>Adapter: testConnection(credentials)

    Adapter->>Adapter: 外部銀行APIに接続テスト
    Note over Adapter: 認証失敗（誤った認証情報）

    Adapter-->>UC: BankConnectionTestResult<br/>(success: false,<br/>errorCode: "BE001",<br/>message: "認証に失敗しました")

    UC-->>API: BankConnectionTestResult
    API-->>Form: 200 OK<br/>{success: false,<br/>errorCode: "BE001",<br/>message: "認証に失敗しました"}

    Form->>User: エラーメッセージ表示<br/>("認証に失敗しました")
```

**エラーレスポンス例**:

```json
{
  "success": false,
  "message": "認証に失敗しました",
  "errorCode": "BE001",
  "accountInfo": null
}
```

---

## チェックリスト

シーケンス図作成時の確認事項：

### 基本項目

- [ ] 主要なユースケースがすべて記載されている
- [ ] アクター、参加者が明確に定義されている
- [ ] 正常系フローが記載されている
- [ ] 異常系フローが記載されている

### 詳細項目

- [ ] エラーハンドリングが明確
- [ ] トランザクション境界が明確（必要な場合）
- [ ] 非同期処理が適切に表現されている（必要な場合）
- [ ] レスポンスの型とステータスコードが明記されている

### 実装ガイド

- [ ] 各ステップに説明が付与されている
- [ ] 前提条件が明確
- [ ] 成功時の結果が明確

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

### ループ

```mermaid
sequenceDiagram
    loop 繰り返し条件
        A->>B: 処理
    end
```

### 並行処理

```mermaid
sequenceDiagram
    par 並行処理
        A->>B: 処理1
    and
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
