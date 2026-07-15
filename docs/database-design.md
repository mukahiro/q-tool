# Firestore データベース設計書 (仮)

本プロジェクトで使用する Firebase Firestore のコレクション構造と、ドキュメント同士の参照関係を定義します。

Firestore はリレーショナルデータベースではないため、外部キー制約はありません。関連するドキュメントIDをフィールドとして保存し、アプリケーション側の処理と Firestore Security Rules で権限・整合性を守ります。

本プロジェクトでは、講義の単位である `rooms/{roomId}` を中心に、セクション・質問・要約をサブコレクションとしてまとめます。これにより「このルームに関係するデータ」が直感的に追いやすくなります。

## 1. 全体構造

```text
rooms/{roomId}
rooms/{roomId}/sections/{sectionId}
rooms/{roomId}/questions/{questionId}
rooms/{roomId}/questions/{questionId}/reactions/{studentSessionId}
rooms/{roomId}/summaries/{summaryId}

inviteCodes/{inviteCode}
teachers/{teacherId}
```

## 2. エンティティ（論理構造）

- **Teacher (User)**: ルームを作成・管理する教師。
- **Room**: 講義ごとに作成される部屋。
- **Section**: 講義内の章立て（「前半」「後半」など）。
- **Question**: 学生から投稿される質問。
- **Reaction (Like)**: 質問に対する「いいね」。
- **Summary**: AIによって生成されたセクションごとの要約。
- **InviteCode**: 入室コードからルームを探すための対応表。
- **TeacherProfile**: 教師アカウントのプロフィール情報。

## 3. コレクション定義

### 3.1 rooms/{roomId} (ルーム)

教師が作成する講義の単位です。

| フィールド名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | string | ドキュメントID |
| teacher_id | string | Firebase Authentication の教師 user uid |
| name | string | ルーム名（講義名） |
| invite_code | string | 入室用の短い英数字PIN。QRコードが読めない場合の手入力にも使う |
| active_section_id | string / null | 現在受付中のセクションID |
| summary_language | string | AI要約に使用する言語。初期値は `ja` |
| summary_tone | string | AI要約の口調。`standard`、`ojousama`、`butler`、`friendly` など |
| is_active | boolean | 現在開講中かどうか |
| question_count | number | ルーム全体の質問数。教師画面で件数表示に使う |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |
| closed_at | timestamp / null | 終了日時 |

### 3.2 inviteCodes/{inviteCode} (招待コード / PIN)

学生がQRコード、URL、またはPIN入力から入室するときに、招待コードからルームを探すための対応表です。

`inviteCode` をドキュメントIDにすることで、同じ招待コードの重複を防ぎやすくします。学生が手入力する可能性があるため、長すぎない英数字にします。

| フィールド名 | 型 | 説明 |
| :--- | :--- | :--- |
| invite_code | string | ドキュメントIDと同じ招待コード。短い英数字PINとして扱う |
| room_id | string | `rooms/{roomId}` への参照ID |
| created_at | timestamp | 作成日時 |

### 3.3 rooms/{roomId}/sections/{sectionId} (セクション)

一つのルーム内での区切りです。

| フィールド名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | string | ドキュメントID |
| room_id | string | 親ルームのID |
| name | string | セクション名（例：第1章） |
| order | number | 表示順序 |
| is_completed | boolean | 終了済みかどうか（AI要約済みか） |
| question_count | number | このセクション内の質問数 |
| reaction_count | number | このセクション内のリアクション数 |
| summary_id | string / null | 対応する要約ドキュメントID |
| created_at | timestamp | 作成日時 |
| completed_at | timestamp / null | セクション終了日時 |

### 3.4 rooms/{roomId}/questions/{questionId} (質問)

学生から投稿される質問です。

| フィールド名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | string | ドキュメントID |
| room_id | string | 親ルームのID |
| section_id | string / null | セクション向け質問の場合は `rooms/{roomId}/sections/{sectionId}` への参照ID。授業全体向け質問の場合は null |
| target_scope | string | `active_section` または `whole_class`。質問が現在セクション向けか授業全体向けかを表す |
| content | string | 質問内容 |
| student_session_id | string | 学生を識別するためのセッションID（匿名用） |
| reaction_count | number | この質問へのリアクション数 |
| created_at | timestamp | 投稿日時 |

### 3.5 rooms/{roomId}/questions/{questionId}/reactions/{studentSessionId} (リアクション)

質問に対する「いいね」です。

`studentSessionId` をドキュメントIDにすることで、同じ学生が同じ質問に複数回リアクションしにくくします。

| フィールド名 | 型 | 説明 |
| :--- | :--- | :--- |
| student_session_id | string | ドキュメントIDと同じ学生セッションID |
| created_at | timestamp | リアクション日時 |

### 3.6 rooms/{roomId}/summaries/{summaryId} (AI要約結果)

セクション終了時に生成される要約データです。

| フィールド名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | string | ドキュメントID |
| room_id | string | 親ルームのID |
| section_id | string | `rooms/{roomId}/sections/{sectionId}` への参照ID |
| content | string | 最初に表示する全体要約テキスト |
| items | array | 要約を項目ごとに分けた配列。各項目に `title`、本文 `text`、参照元の質問ID配列 `source_question_ids` を持つ |
| source_questions | array | 要約作成時に参照した元質問のスナップショット。質問ID、表示ラベル、本文、リアクション数を保存する |
| summary_language | string | この要約で使用した言語 |
| summary_tone | string | この要約で使用した口調 |
| created_at | timestamp | 生成日時 |

### 3.7 teachers/{teacherId} (教師プロフィール)

教師のプロフィール編集画面で登録する情報です。

`teacherId` には Firebase Authentication の教師 user uid を使います。プロフィール情報がまだ存在しない場合、画面では各項目を「未設定」と表示します。

| フィールド名 | 型 | 説明 |
| :--- | :--- | :--- |
| uid | string | Firebase Authentication の教師 user uid |
| email | string / null | 教師のメールアドレス。表示確認用 |
| username | string | 画面に表示するユーザー名。必須 |
| affiliation | string / null | 学校名・所属など |
| subject | string / null | 担当授業科目など |
| contact_url | string / null | LMS、Google Classroom、学校ポータルなどの連絡用URL |
| bio | string / null | 自己紹介や学生向けの補足 |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

## 4. 参照関係

- `Teacher` は複数の `Room` を持つ (1:N)
- `Room` は複数の `Section` を持つ (1:N)
- `Room` は複数の `Question` を持つ (1:N)
- `Question` は複数の `Reaction` を持つ (1:N)
- `Room` は複数の `Summary` を持つ (1:N)
- `Section` は `summary_id` によって1つの `Summary` と紐づく (1:1)
- `InviteCode` は1つの `Room` と紐づく (1:1)
- `TeacherProfile` は Firebase Authentication の教師ユーザーと紐づく (1:1)

## 5. 招待コード / PIN の方針

招待コードはQRコード内のURLに含めるだけでなく、学生が手入力するPINとしても使います。そのため、長すぎない英数字にします。

- 大文字英数字6文字にする。
- 紛らわしい文字（例: `0` と `O`, `1` と `I`）は避ける。
- ルーム作成時に `inviteCodes/{inviteCode}` を確認し、重複しないコードを発行する。
- QRコードは `https://example.com/join/{inviteCode}` のような入室URLを表す。

## 6. 集計フィールドの方針

Firestore では、毎回すべての質問やリアクションを読み込んで件数を数えると、読み取り回数が増えます。そのため、よく使う件数はドキュメント内に保存します。

- `rooms/{roomId}.question_count`: ルーム全体の質問数
- `rooms/{roomId}/sections/{sectionId}.question_count`: セクションごとの質問数
- `rooms/{roomId}/sections/{sectionId}.reaction_count`: セクションごとのリアクション数
- `rooms/{roomId}/questions/{questionId}.reaction_count`: 質問ごとのリアクション数

これらの値は、質問投稿やリアクション追加のタイミングで、Firestore のトランザクションや `increment` を使って更新します。

## 7. セキュリティ方針 (Firestore Security Rules)

- **rooms**: 作成した教師のみが管理（編集・削除）可能。学生は招待コード経由で参加に必要な情報のみ閲覧可能。
- **inviteCodes**: 学生が入室時に読み取れる。作成・更新・削除は教師またはサーバー側処理のみ。
- **sections**: ルームの教師が管理。学生は入室済みルームのセクション情報を閲覧可能。
- **questions**: 学生は入室済みルームに投稿可能。教師に個別質問を見せるかどうかは、セクション状態と画面仕様に合わせて制御する。
- **reactions**: 学生は自分の `student_session_id` に対応するリアクションのみ作成可能。重複投票はドキュメントIDでも防止する。
- **summaries**: セクション終了後に閲覧可能。作成は教師操作を起点にしたサーバー側処理で行う。
- **teachers**: ログイン中の教師本人のみが自分のプロフィールを閲覧・編集可能。

## 8. 補足

学生はログイン不要なので、ブラウザごとのセッションID（LocalStorage等で保持）を記録することで、同一人物による連投制限や「いいね」の重複防止を可能にします。

「セクション終了まで教師画面に個別質問を表示しない」という要件は重要です。まずはUIで個別質問を表示しない設計にし、より厳密に守る必要が出た場合は Firestore Security Rules とサーバー側要約処理を組み合わせて、未完了セクションの質問本文を教師クライアントから直接読めない構成を検討します。
