# シーケンス図

このドキュメントでは、データ同期間隔設定機能の処理フローをシーケンス図で記載しています。

## 目次

1. [全体設定取得のフロー](#全体設定取得のフロー)
2. [全体設定更新のフロー](#全体設定更新のフロー)
3. [金融機関設定取得のフロー](#金融機関設定取得のフロー)
4. [金融機関設定更新のフロー](#金融機関設定更新のフロー)
5. [エラーハンドリングフロー](#エラーハンドリングフロー)

---

## 全体設定取得のフロー

### 概要

**ユースケース**: ユーザーが設定画面を開き、現在の全体設定を表示

**アクター**: ユーザー

**前提条件**:

- ユーザーが認証済み

**成功時の結果**:

- 現在の同期設定が表示される
- 設定が存在しない場合はデフォルト値が返却される

### 正常系フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as SyncSettingsController
    participant UC as GetSyncSettingsUseCase
    participant Repo as SyncSettingsRepository

    User->>FE: 設定画面を開く
    FE->>API: GET /api/sync-settings

    API->>API: リクエスト検証
    API->>UC: execute()

    UC->>Repo: find()
    Repo-->>UC: SyncSettings | null

    alt 設定が存在する場合
        UC->>UC: EntityをDTOに変換
        UC-->>API: SyncSettingsDto
    else 設定が存在しない場合
        UC->>UC: デフォルト設定を作成
        UC-->>API: SyncSettingsDto (デフォルト値)
    end

    API->>API: ResponseDTOに変換
    API-->>FE: 200 OK<br/>{success: true, data: {...}}
    FE->>FE: UI更新（設定表示）
    FE-->>User: 設定画面を表示
```

### ステップ詳細

1. **ユーザーアクション**
   - ユーザーが設定画面を開く

2. **API リクエスト**
   - エンドポイント: `GET /api/sync-settings`
   - 認証: JWT トークン必須

3. **設定取得**
   - リポジトリから設定を取得
   - 設定が存在しない場合はデフォルト値（標準: 6時間ごと）を返却

4. **レスポンス**
   - ResponseDTO: `SyncSettingsResponseDto`
   - HTTPステータス: 200 OK

---

## 全体設定更新のフロー

### 概要

**ユースケース**: ユーザーが同期設定を変更し、保存

**アクター**: ユーザー

**前提条件**:

- ユーザーが認証済み
- 設定画面が表示されている

**成功時の結果**:

- 設定が更新される
- スケジュールが動的に更新される
- 次回同期時刻が再計算される

### 正常系フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as SyncSettingsController
    participant UC as UpdateSyncSettingsUseCase
    participant Repo as SyncSettingsRepository
    participant Scheduler as ISchedulerService

    User->>FE: 設定を変更して「保存」ボタンクリック
    FE->>FE: バリデーション
    FE->>API: PATCH /api/sync-settings<br/>{UpdateSyncSettingsRequestDto}

    API->>API: リクエスト検証
    API->>UC: execute(dto)

    UC->>Repo: find()
    Repo-->>UC: SyncSettings | null

    alt 設定が存在する場合
        UC->>UC: 既存設定を更新
    else 設定が存在しない場合
        UC->>UC: 新規設定を作成
    end

    UC->>UC: バリデーション実行
    alt バリデーションエラー
        UC-->>API: ValidationError
        API-->>FE: 400 Bad Request<br/>{error: {...}}
        FE-->>User: エラーメッセージ表示
    else バリデーション成功
        UC->>UC: デフォルト設定を利用する全金融機関の次回同期時刻を再計算
        UC->>Repo: save(settings)
        Repo-->>UC: SyncSettings

        UC->>Scheduler: updateSchedule(settings)
        Scheduler->>Scheduler: SchedulerRegistryで更新
        Scheduler-->>UC: 完了

        UC-->>API: SyncSettingsDto
        API->>API: ResponseDTOに変換
        API-->>FE: 200 OK<br/>{success: true, data: {...}}
        FE->>FE: UI更新（成功通知）
        FE-->>User: 「設定を保存しました」
    end
```

### ステップ詳細

1. **ユーザーアクション**
   - ユーザーが同期間隔や詳細オプションを変更
   - 「保存」ボタンをクリック

2. **Frontend バリデーション**
   - 同期間隔の範囲チェック（5分〜30日）
   - 夜間モード時刻の形式チェック（HH:mm）
   - 夜間モード開始時刻 < 終了時刻のチェック

3. **API リクエスト**
   - エンドポイント: `PATCH /api/sync-settings`（部分更新をサポート）
   - RequestDTO: `UpdateSyncSettingsRequestDto`（すべてのフィールドが任意）

4. **設定更新**
   - 既存設定を更新、または新規作成
   - バリデーション実行
   - デフォルト設定を利用している全金融機関の次回同期時刻を再計算

5. **スケジュール更新**
   - ISchedulerServiceを通じてスケジュールを動的に更新
   - SchedulerRegistryを使用してCronJobを再登録

6. **レスポンス**
   - ResponseDTO: `SyncSettingsResponseDto`
   - HTTPステータス: 200 OK

---

## 金融機関設定取得のフロー（全件取得）

### 概要

**ユースケース**: ユーザーが金融機関ごとの設定一覧を表示

**アクター**: ユーザー

**前提条件**:

- ユーザーが認証済み
- 金融機関が連携済み

**成功時の結果**:

- 全金融機関の同期設定が表示される
- 各金融機関の最終同期時刻、次回同期時刻が表示される

### 正常系フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as SyncSettingsController
    participant UC as GetAllInstitutionSyncSettingsUseCase
    participant Repo as SyncSettingsRepository

    User->>FE: 金融機関設定タブを開く
    FE->>API: GET /api/sync-settings/institutions

    API->>API: リクエスト検証
    API->>UC: execute()

    UC->>Repo: findAllInstitutionSettings()
    Repo-->>UC: InstitutionSyncSettings[]

    UC->>UC: Entity[]をDTO[]に変換
    UC-->>API: InstitutionSyncSettingsDto[]

    API->>API: ResponseDTOに変換
    API-->>FE: 200 OK<br/>{success: true, data: [...]}
    FE->>FE: UI更新（設定一覧表示）
    FE-->>User: 金融機関ごとの設定を表示
```

### ステップ詳細

1. **ユーザーアクション**
   - ユーザーが設定画面の「金融機関ごとの設定」タブを開く

2. **API リクエスト**
   - エンドポイント: `GET /api/sync-settings/institutions`
   - 認証: JWT トークン必須

3. **設定取得**
   - 全金融機関の設定を取得
   - 設定が存在しない金融機関はデフォルト設定を返却

4. **レスポンス**
   - ResponseDTO: `InstitutionSyncSettingsResponseDto[]`
   - HTTPステータス: 200 OK

---

## 金融機関設定更新のフロー

### 概要

**ユースケース**: ユーザーが特定金融機関の同期間隔を変更し、保存

**アクター**: ユーザー

**前提条件**:

- ユーザーが認証済み
- 金融機関が連携済み
- 設定画面が表示されている

**成功時の結果**:

- 金融機関の設定が更新される
- 次回同期時刻が再計算される
- スケジュールが動的に更新される

### 正常系フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as SyncSettingsController
    participant UC as UpdateInstitutionSyncSettingsUseCase
    participant Repo as SyncSettingsRepository
    participant Scheduler as ISchedulerService

    User->>FE: 金融機関の設定を変更して「保存」ボタンクリック
    FE->>FE: バリデーション
    FE->>API: PATCH /api/sync-settings/institutions/:id<br/>{UpdateInstitutionSyncSettingsRequestDto}

    API->>API: リクエスト検証
    API->>UC: execute(institutionId, dto)

    UC->>Repo: findInstitutionSettings(institutionId)
    Repo-->>UC: InstitutionSyncSettings | null

    alt 設定が存在する場合
        UC->>UC: 既存設定を更新
    else 設定が存在しない場合
        UC->>UC: 新規設定を作成
    end

    UC->>UC: バリデーション実行
    alt バリデーションエラー
        UC-->>API: ValidationError
        API-->>FE: 400 Bad Request<br/>{error: {...}}
        FE-->>User: エラーメッセージ表示
    else バリデーション成功
        UC->>UC: 次回同期時刻を計算
        UC->>Repo: saveInstitutionSettings(settings)
        Repo-->>UC: InstitutionSyncSettings

        UC->>Scheduler: updateInstitutionSchedule(institutionId, settings)
        Scheduler->>Scheduler: SchedulerRegistryで更新
        Scheduler-->>UC: 完了

        UC-->>API: InstitutionSyncSettingsDto
        API->>API: ResponseDTOに変換
        API-->>FE: 200 OK<br/>{success: true, data: {...}}
        FE->>FE: UI更新（成功通知）
        FE-->>User: 「設定を保存しました」
    end
```

### ステップ詳細

1. **ユーザーアクション**
   - ユーザーが特定金融機関の同期間隔を変更
   - 「保存」ボタンをクリック

2. **Frontend バリデーション**
   - 同期間隔の範囲チェック（5分〜30日）
   - 必須項目のチェック

3. **API リクエスト**
   - エンドポイント: `PATCH /api/sync-settings/institutions/:id`（部分更新をサポート）
   - RequestDTO: `UpdateInstitutionSyncSettingsRequestDto`

4. **設定更新**
   - 既存設定を更新、または新規作成
   - 次回同期時刻を計算

5. **スケジュール更新**
   - 特定金融機関のスケジュールを動的に更新

6. **レスポンス**
   - ResponseDTO: `InstitutionSyncSettingsResponseDto`
   - HTTPステータス: 200 OK

---

## エラーハンドリングフロー

### バリデーションエラー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as SyncSettingsController
    participant UC as UpdateSyncSettingsUseCase

    User->>FE: 不正な設定値を入力して「保存」
    FE->>FE: バリデーション（一部）
    FE->>API: PATCH /api/sync-settings<br/>{invalidData}

    API->>API: リクエスト検証
    API->>UC: execute(dto)

    UC->>UC: バリデーション実行
    UC-->>API: ValidationError<br/>{code: "SY001", message: "不正な同期間隔"}

    API->>API: エラーレスポンスに変換
    API-->>FE: 400 Bad Request<br/>{success: false, error: {...}}
    FE->>FE: エラーメッセージ表示
    FE-->>User: 「5分〜30日の範囲で設定してください」
```

### リソース未検出エラー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as SyncSettingsController
    participant UC as UpdateInstitutionSyncSettingsUseCase
    participant Repo as SyncSettingsRepository

    User->>FE: 存在しない金融機関IDで設定更新
    FE->>API: PATCH /api/sync-settings/institutions/invalid-id<br/>{dto}

    API->>API: リクエスト検証
    API->>UC: execute("invalid-id", dto)

    UC->>Repo: findInstitutionSettings("invalid-id")
    Repo-->>UC: null

    UC->>UC: 金融機関存在チェック（InstitutionRepository）
    UC-->>API: InstitutionNotFoundError

    API->>API: エラーレスポンスに変換
    API-->>FE: 404 Not Found<br/>{success: false, error: {...}}
    FE->>FE: エラーメッセージ表示
    FE-->>User: 「指定された金融機関が見つかりません」
```

### サーバーエラー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as SyncSettingsController
    participant UC as UpdateSyncSettingsUseCase
    participant Repo as SyncSettingsRepository

    User->>FE: 設定を保存
    FE->>API: PATCH /api/sync-settings<br/>{dto}

    API->>UC: execute(dto)
    UC->>Repo: save(settings)
    Repo-->>UC: Error (DB接続失敗など)

    UC-->>API: InternalServerError
    API->>API: エラーレスポンスに変換
    API-->>FE: 500 Internal Server Error<br/>{success: false, error: {...}}
    FE->>FE: エラーメッセージ表示
    FE-->>User: 「システムエラーが発生しました。しばらく待ってから再試行してください」
```

---

## チェックリスト

設計書作成時の確認事項：

### 必須項目

- [x] 主要なユースケースのシーケンス図が記載されている
- [x] 正常系と異常系のフローが記載されている
- [x] エラーハンドリングフローが記載されている
- [x] 各ステップの説明が記載されている

### 推奨項目

- [x] 前提条件と成功時の結果が明確に記載されている
- [x] バリデーションのタイミングが明確になっている
- [x] スケジュール更新のタイミングが明確になっている
