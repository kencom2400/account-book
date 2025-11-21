# 金融機関連携機能 (FR-001〜FR-005) モジュール詳細設計書

**対象機能**:

- FR-001: 銀行口座との連携
- FR-002: クレジットカードとの連携
- FR-003: 証券会社との連携
- FR-004: バックグラウンド接続確認
- FR-005: 接続失敗通知

**作成日**: 2025-11-20
**最終更新日**: 2025-11-20
**バージョン**: 1.0

## 概要

このドキュメントは、完了済みの金融機関連携機能 (FR-001〜FR-005) に関するモジュールの詳細設計を文書化したものです。実装済みの機能要件に基づき、技術的な設計詳細を示します。

## 目次

1. [画面遷移図](./screen-transitions.md)
2. [クラス図](./class-diagrams.md)
3. [シーケンス図](./sequence-diagrams.md)
4. [状態遷移図](./state-transitions.md)
5. [入出力設計](./input-output-design.md)
6. [バッチ処理詳細](./batch-processing.md)

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
│  - External API Adapters                │
│  - Data Persistence (JSON/TypeORM)      │
└─────────────────────────────────────────┘
```

## 実装済みモジュール

### Backend (NestJS)

- **institution**: 金融機関管理 (FR-001)
- **credit-card**: クレジットカード管理 (FR-002)
- **securities**: 証券会社管理 (FR-003)
- **health**: 接続確認・通知 (FR-004, FR-005)
- **transaction**: 取引データ管理 (FR-006で使用予定)
- **category**: カテゴリ管理 (FR-008で使用)

### Frontend (Next.js)

- **banks/add**: 銀行追加画面 (FR-001)
- **dashboard**: ダッシュボード
- **forms**: 認証情報入力フォーム
- **notifications**: エラー通知コンポーネント (FR-005)

## 技術スタック

### Backend

- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x
- **ORM**: TypeORM (将来的なDB移行用)
- **Data Storage**: JSON (現在)
- **Validation**:
  - `class-validator`: バックエンドDTO/Entityの検証
  - `zod`: フロントエンドフォーム検証、API型安全性の補完
- **Testing**: Jest

### Frontend

- **Framework**: Next.js 14.x (App Router)
- **Language**: TypeScript 5.x
- **State Management**: Zustand
- **HTTP Client**: Axios
- **UI Components**: Tailwind CSS, カスタムコンポーネント
- **Testing**: Jest, React Testing Library

## データフロー概要

```
User → Frontend → Backend API → Domain Logic → Infrastructure
                                                    ↓
                                                External API
                                                    ↓
                                                JSON Storage
```

## セキュリティ要件

- **認証情報の暗号化**: EncryptedCredentials値オブジェクトで管理
- **HTTPS通信**: 全てのAPI通信で必須
- **PCI-DSS準拠**: クレジットカード情報は下4桁のみ保存
- **アクセスログ**: 全API呼び出しをログ記録

## 参考資料

- [機能要件書: FR-001-007](../../functional-requirements/FR-001-007_data-acquisition.md)
- [システムアーキテクチャ](../../system-architecture.md)
- [Epic List](../../epic-list.md)

## 変更履歴

| 日付       | バージョン | 変更内容 | 作成者             |
| ---------- | ---------- | -------- | ------------------ |
| 2025-11-20 | 1.0        | 初版作成 | Gemini Code Assist |
