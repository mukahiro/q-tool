# Firestore データベース設計書 (仮)

本プロジェクトで使用する Firebase Firestore のコレクション構造と、ドキュメント同士の参照関係を定義します。

Firestore はリレーショナルデータベースではないため、外部キー制約はありません。関連するドキュメントIDをフィールドとして保存し、アプリケーション側の処理と Firestore Security Rules で権限・整合性を守ります。

## 1. エンティティ図（論理構造）

- **Teacher (User)**: ルームを作成・管理する教師。
- **Room**: 講義ごとに作成される部屋。
- **Section**: 講義内の章立て（「前半」「後半」など）。
- **Question**: 学生から投稿される質問。
- **Reaction (Like)**: 質問に対する「いいね」。
- **Summary**: AIによって生成されたセクションごとの要約。

## 2. コレクション定義

### 2.1 profiles (教師プロフィール)
Firebase Authentication のユーザーIDと紐づく、教師の基本情報。

| フィールド名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | string | ドキュメントID。Firebase Authentication の user uid と同じ値 |
| email | string | メールアドレス |
| name | string | 表示名 |
| created_at | timestamp | 作成日時 |

### 2.2 rooms (ルーム)
教師が作成する講義の単位。

| フィールド名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | string | ドキュメントID |
| teacher_id | string | `profiles/{teacher_id}` への参照ID |
| name | string | ルーム名（講義名） |
| invite_code | string | 入室用の招待コード（QRコード用）。重複しないよう作成時に確認する |
| is_active | boolean | 現在開講中かどうか |
| created_at | timestamp | 作成日時 |

### 2.3 sections (セクション)
一つのルーム内での区切り。

| フィールド名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | string | ドキュメントID |
| room_id | string | `rooms/{room_id}` への参照ID |
| name | string | セクション名（例：第1章） |
| order | integer | 表示順序 |
| is_completed | boolean | 終了済みかどうか（AI要約済みか） |
| created_at | timestamp | 作成日時 |

### 2.4 questions (質問)
学生から投稿されるデータ。

| フィールド名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | string | ドキュメントID |
| room_id | string | `rooms/{room_id}` への参照ID |
| section_id | string | `sections/{section_id}` への参照ID |
| content | text | 質問内容 |
| student_session_id | string | 学生を識別するためのセッションID（匿名用） |
| created_at | timestamp | 投稿日時 |

### 2.5 reactions (リアクション)
質問に対する「いいね」。

| フィールド名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | string | ドキュメントID |
| question_id | string | `questions/{question_id}` への参照ID |
| room_id | string | `rooms/{room_id}` への参照ID |
| student_session_id | string | 重複投票防止用のセッションID |
| created_at | timestamp | リアクション日時 |

### 2.6 summaries (AI要約結果)
セクション終了時に生成される要約データ。

| フィールド名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | string | ドキュメントID |
| room_id | string | `rooms/{room_id}` への参照ID |
| section_id | string | `sections/{section_id}` への参照ID。1セクションにつき1件のみ作成する |
| content | text | 要約テキスト |
| categories | array / map | カテゴリ分けされた結果など |
| created_at | timestamp | 生成日時 |

## 3. 参照関係

- `Teacher` は複数の `Room` を持つ (1:N)
- `Room` は複数の `Section` を持つ (1:N)
- `Section` は複数の `Question` を持つ (1:N)
- `Section` は1つの `Summary` を持つ (1:1)
- `Question` は複数の `Reaction` を持つ (1:N)

## 4. セキュリティ方針 (Firestore Security Rules)

- **profiles**: 本人のみが閲覧・編集可能。
- **rooms**: 作成した教師のみが管理（編集・削除）可能。学生は招待コードで閲覧のみ可能。
- **sections**: ルームの教師が管理。学生は閲覧のみ。
- **questions**: 学生は誰でも投稿可能。閲覧は同じルーム内のユーザーのみ。
- **summaries**: 全ユーザーが閲覧可能（セクション終了後）。
- **reactions**: 学生は自分の `student_session_id` に紐づくリアクションのみ作成可能。重複投票はアプリ側でも防止する。

## 5. 補足
学生はログイン不要なので、ブラウザごとのセッションID（LocalStorage等で保持）を記録することで、同一人物による連投制限や「いいね」の重複防止を可能にする。

Firestore では複雑な集計や一括更新が必要な処理は設計を工夫する必要があります。たとえば「質問数」「いいね数」は読み取り回数を減らすため、必要に応じてドキュメント内にカウント用フィールドを持たせます。
