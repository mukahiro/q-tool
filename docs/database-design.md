# データベース設計書 (仮)

本プロジェクトで使用するデータベース（PostgreSQL / Prisma）のテーブル構造とリレーションを定義します。

## 1. エンティティ図（論理構造）

- **Teacher (User)**: ルームを作成・管理する教師。
- **Room**: 講義ごとに作成される部屋。
- **Section**: 講義内の章立て（「前半」「後半」など）。
- **Question**: 学生から投稿される質問。
- **Reaction (Like)**: 質問に対する「いいね」。
- **Summary**: AIによって生成されたセクションごとの要約。

## 2. テーブル定義

### 2.1 profiles (教師プロフィール)
Supabase Authの `users` テーブルと紐づく、教師の基本情報。

| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | uuid (PK) | Supabase Authのuser id |
| email | string | メールアドレス |
| name | string | 表示名 |
| created_at | timestamp | 作成日時 |

### 2.2 rooms (ルーム)
教師が作成する講義の単位。

| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | uuid (PK) | ルームID |
| teacher_id | uuid (FK) | profiles.idへの参照 |
| name | string | ルーム名（講義名） |
| invite_code | string (Unique) | 入室用の招待コード（QRコード用） |
| is_active | boolean | 現在開講中かどうか |
| created_at | timestamp | 作成日時 |

### 2.3 sections (セクション)
一つのルーム内での区切り。

| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | uuid (PK) | セクションID |
| room_id | uuid (FK) | rooms.idへの参照 |
| name | string | セクション名（例：第1章） |
| order | integer | 表示順序 |
| is_completed | boolean | 終了済みかどうか（AI要約済みか） |
| created_at | timestamp | 作成日時 |

### 2.4 questions (質問)
学生から投稿されるデータ。

| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | uuid (PK) | 質問ID |
| section_id | uuid (FK) | sections.idへの参照 |
| content | text | 質問内容 |
| student_session_id | string | 学生を識別するためのセッションID（匿名用） |
| created_at | timestamp | 投稿日時 |

### 2.5 reactions (リアクション)
質問に対する「いいね」。

| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | uuid (PK) | リアクションID |
| question_id | uuid (FK) | questions.idへの参照 |
| student_session_id | string | 重複投票防止用のセッションID |

### 2.6 summaries (AI要約結果)
セクション終了時に生成される要約データ。

| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | uuid (PK) | 要約ID |
| section_id | uuid (FK, Unique) | sections.idへの参照 |
| content | text | 要約テキスト |
| categories | jsonb | カテゴリ分けされた結果など |
| created_at | timestamp | 生成日時 |

## 3. リレーションシップ

- `Teacher` は複数の `Room` を持つ (1:N)
- `Room` は複数の `Section` を持つ (1:N)
- `Section` は複数の `Question` を持つ (1:N)
- `Section` は1つの `Summary` を持つ (1:1)
- `Question` は複数の `Reaction` を持つ (1:N)

## 4. セキュリティ方針 (RLS)

- **profiles**: 本人のみが閲覧・編集可能。
- **rooms**: 作成した教師のみが管理（編集・削除）可能。学生は招待コードで閲覧のみ可能。
- **sections**: ルームの教師が管理。学生は閲覧のみ。
- **questions**: 学生は誰でも投稿可能。閲覧は同じルーム内のユーザーのみ。
- **summaries**: 全ユーザーが閲覧可能（セクション終了後）。

## 5. 補足
学生はログイン不要なので、ブラウザごとのセッションID（LocalStorage等で保持）を記録することで、同一人物による連投制限や「いいね」の重複防止を可能にする。