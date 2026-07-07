# テストデータ設計書

開発中に画面表示やFirestore連携を確認するためのテストデータを定義します。

このドキュメントのデータは、Firebase Console で手入力する場合や、将来的にシードスクリプトを作る場合の共通サンプルとして使います。本番データではありません。

## 1. 前提

- 教師ユーザーは Firebase Authentication で作成済みとする。
- Firestore の `teacher_id` には、Firebase Authentication の教師ユーザー `uid` を入れる。
- 例では `teacher_demo_uid_001` を仮の教師UIDとして使う。
- Timestamp は Firebase Console で入力する場合、実際の日時に置き換えてよい。

## 2. 投入方法

`.env.local` に Firebase の設定を入れたうえで、次のコマンドを実行します。

```bash
npm run seed:test-data
```

このコマンドは、テスト教師ユーザーを作成またはログインし、実際の Firebase Authentication の `uid` を `teacher_id` に入れて Firestore へ投入します。

同じドキュメントIDのデータがある場合は上書きされます。

## 3. 教師ユーザー

Firebase Authentication に以下のテスト教師を作成します。

| 項目 | 値 |
| :--- | :--- |
| メールアドレス | `teacher@example.com` |
| パスワード | `password123` |
| uid | `teacher_demo_uid_001` |

Firebase Authentication の `uid` は自動生成されるため、実際の値を Firestore の `teacher_id` に合わせます。

### 3.1 教師プロフィール

プロフィール編集画面を確認するため、以下のドキュメントを任意で作成します。

パス:

```text
teachers/teacher_demo_uid_001
```

データ:

```json
{
  "uid": "teacher_demo_uid_001",
  "email": "teacher@example.com",
  "username": "山田先生",
  "affiliation": "q-tool 高等学校",
  "subject": "数学I",
  "contact_url": "https://classroom.google.com/",
  "bio": "授業中の疑問を気軽に投稿してください。",
  "created_at": "2026-06-23T08:50:00+09:00",
  "updated_at": "2026-06-23T08:50:00+09:00"
}
```

## 4. ルーム

### 4.1 開講中ルーム

パス:

```text
rooms/room_math_001
```

データ:

```json
{
  "id": "room_math_001",
  "teacher_id": "teacher_demo_uid_001",
  "name": "数学I 二次関数",
  "invite_code": "MATH7K",
  "active_section_id": "section_math_001_intro",
  "is_active": true,
  "question_count": 4,
  "created_at": "2026-06-23T09:00:00+09:00",
  "updated_at": "2026-06-23T09:20:00+09:00",
  "closed_at": null
}
```

### 4.2 終了済みルーム

パス:

```text
rooms/room_history_001
```

データ:

```json
{
  "id": "room_history_001",
  "teacher_id": "teacher_demo_uid_001",
  "name": "日本史 鎌倉時代",
  "invite_code": "HIST5R",
  "active_section_id": null,
  "is_active": false,
  "question_count": 2,
  "created_at": "2026-06-20T10:00:00+09:00",
  "updated_at": "2026-06-20T11:30:00+09:00",
  "closed_at": "2026-06-20T11:30:00+09:00"
}
```

## 5. 招待コード / PIN

### 5.1 開講中ルーム用

パス:

```text
inviteCodes/MATH7K
```

データ:

```json
{
  "invite_code": "MATH7K",
  "room_id": "room_math_001",
  "created_at": "2026-06-23T09:00:00+09:00"
}
```

### 5.2 終了済みルーム用

パス:

```text
inviteCodes/HIST5R
```

データ:

```json
{
  "invite_code": "HIST5R",
  "room_id": "room_history_001",
  "created_at": "2026-06-20T10:00:00+09:00"
}
```

## 6. セクション

### 6.1 開講中セクション

パス:

```text
rooms/room_math_001/sections/section_math_001_intro
```

データ:

```json
{
  "id": "section_math_001_intro",
  "room_id": "room_math_001",
  "name": "導入: 放物線の形",
  "order": 1,
  "is_completed": false,
  "question_count": 2,
  "reaction_count": 3,
  "summary_id": null,
  "created_at": "2026-06-23T09:05:00+09:00",
  "completed_at": null
}
```

### 6.2 完了済みセクション

パス:

```text
rooms/room_math_001/sections/section_math_001_basic
```

データ:

```json
{
  "id": "section_math_001_basic",
  "room_id": "room_math_001",
  "name": "基本: 平方完成",
  "order": 2,
  "is_completed": true,
  "question_count": 1,
  "reaction_count": 1,
  "summary_id": "summary_math_001_basic",
  "created_at": "2026-06-23T09:25:00+09:00",
  "completed_at": "2026-06-23T09:45:00+09:00"
}
```

### 6.3 終了済みルームのセクション

パス:

```text
rooms/room_history_001/sections/section_history_001_intro
```

データ:

```json
{
  "id": "section_history_001_intro",
  "room_id": "room_history_001",
  "name": "導入: 鎌倉幕府の成立",
  "order": 1,
  "is_completed": true,
  "question_count": 2,
  "reaction_count": 1,
  "summary_id": null,
  "created_at": "2026-06-20T10:05:00+09:00",
  "completed_at": "2026-06-20T10:45:00+09:00"
}
```

## 7. 質問

### 7.1 開講中セクションの質問

パス:

```text
rooms/room_math_001/questions/question_math_001
```

データ:

```json
{
  "id": "question_math_001",
  "room_id": "room_math_001",
  "section_id": "section_math_001_intro",
  "content": "放物線が上に開くか下に開くかはどこを見ればいいですか？",
  "student_session_id": "student_session_a",
  "reaction_count": 2,
  "created_at": "2026-06-23T09:10:00+09:00"
}
```

パス:

```text
rooms/room_math_001/questions/question_math_002
```

データ:

```json
{
  "id": "question_math_002",
  "room_id": "room_math_001",
  "section_id": "section_math_001_intro",
  "content": "グラフの頂点は式からすぐ分かりますか？",
  "student_session_id": "student_session_b",
  "reaction_count": 1,
  "created_at": "2026-06-23T09:14:00+09:00"
}
```

### 7.2 完了済みセクションの質問

パス:

```text
rooms/room_math_001/questions/question_math_003
```

データ:

```json
{
  "id": "question_math_003",
  "room_id": "room_math_001",
  "section_id": "section_math_001_basic",
  "content": "平方完成で符号を間違えやすいです。コツはありますか？",
  "student_session_id": "student_session_c",
  "reaction_count": 1,
  "created_at": "2026-06-23T09:32:00+09:00"
}
```

### 7.3 授業全体向けの質問

パス:

```text
rooms/room_math_001/questions/question_math_004
```

データ:

```json
{
  "id": "question_math_004",
  "room_id": "room_math_001",
  "section_id": null,
  "target_scope": "whole_class",
  "content": "今日の内容全体で、テスト前に特に復習した方がよいところはどこですか？",
  "student_session_id": "student_session_d",
  "reaction_count": 0,
  "created_at": "2026-06-23T09:38:00+09:00"
}
```

### 7.4 終了済みルームの質問

パス:

```text
rooms/room_history_001/questions/question_history_001
```

データ:

```json
{
  "id": "question_history_001",
  "room_id": "room_history_001",
  "section_id": "section_history_001_intro",
  "content": "御恩と奉公の関係が少し混乱しています。具体例はありますか？",
  "student_session_id": "student_session_d",
  "reaction_count": 1,
  "created_at": "2026-06-20T10:18:00+09:00"
}
```

パス:

```text
rooms/room_history_001/questions/question_history_002
```

データ:

```json
{
  "id": "question_history_002",
  "room_id": "room_history_001",
  "section_id": "section_history_001_intro",
  "content": "源頼朝が幕府を開いた年は1192年と1185年のどちらで覚えるべきですか？",
  "student_session_id": "student_session_e",
  "reaction_count": 0,
  "created_at": "2026-06-20T10:27:00+09:00"
}
```

## 8. リアクション

リアクションは、学生セッションIDをドキュメントIDにします。

パス:

```text
rooms/room_math_001/questions/question_math_001/reactions/student_session_b
```

データ:

```json
{
  "student_session_id": "student_session_b",
  "created_at": "2026-06-23T09:15:00+09:00"
}
```

パス:

```text
rooms/room_math_001/questions/question_math_001/reactions/student_session_c
```

データ:

```json
{
  "student_session_id": "student_session_c",
  "created_at": "2026-06-23T09:16:00+09:00"
}
```

パス:

```text
rooms/room_math_001/questions/question_math_002/reactions/student_session_a
```

データ:

```json
{
  "student_session_id": "student_session_a",
  "created_at": "2026-06-23T09:18:00+09:00"
}
```

パス:

```text
rooms/room_math_001/questions/question_math_003/reactions/student_session_a
```

データ:

```json
{
  "student_session_id": "student_session_a",
  "created_at": "2026-06-23T09:36:00+09:00"
}
```

パス:

```text
rooms/room_history_001/questions/question_history_001/reactions/student_session_e
```

データ:

```json
{
  "student_session_id": "student_session_e",
  "created_at": "2026-06-20T10:30:00+09:00"
}
```

## 9. AI要約

パス:

```text
rooms/room_math_001/summaries/summary_math_001_basic
```

データ:

```json
{
  "id": "summary_math_001_basic",
  "room_id": "room_math_001",
  "section_id": "section_math_001_basic",
  "content": "平方完成の符号ミスに関する質問がありました。特に、定数項を移動するときと、括弧の外に出す値の扱いで混乱が見られます。",
  "items": [
    {
      "title": "平方完成の符号ミス",
      "text": "平方完成の符号ミスに関する質問がありました。特に、定数項を移動するときと、括弧の外に出す値の扱いで混乱が見られます。",
      "source_question_ids": ["question_math_003"]
    }
  ],
  "source_questions": [
    {
      "id": "question_math_003",
      "sourceLabel": "Q1",
      "content": "平方完成で符号を間違えやすいです。コツはありますか？",
      "reactionCount": 1
    }
  ],
  "created_at": "2026-06-23T09:46:00+09:00"
}
```

## 10. 画面確認で使うURL

| 目的 | URL |
| :--- | :--- |
| LP | `/` |
| 教師ログイン | `/login` |
| 教師ダッシュボード | `/dashboard` |
| ルーム一覧 | `/rooms` |
| ルーム詳細 | `/rooms/room_math_001` |
| 招待表示 | `/rooms/room_math_001/invite` |
| 要約一覧 | `/rooms/room_math_001/summaries` |
| PIN入力 | `/join` |
| 招待URL | `/join/MATH7K` |
| 学生質問画面 | `/rooms/room_math_001/chat` |
| 終了済み学生質問画面 | `/rooms/room_history_001/chat` |

## 11. 注意点

- Firebase Console で手入力する場合、日時フィールドは Firestore の Timestamp 型として入力する。
- `teacher_id` は実際の Firebase Authentication の `uid` に置き換える。
- `question_count` や `reaction_count` は、質問やリアクション数と一致するようにする。
- このテストデータはMVP確認用であり、本番環境には投入しない。
