# ルーティング設計書

本プロジェクトの Next.js App Router におけるURL設計と、`src/app/` の役割を定義します。

`src/app/` はURLとページの枠組みを決める薄い層です。画面の中身、状態管理、Firestore操作などは、原則として `src/features/` 側に置きます。

## 1. 基本方針

- App Router を使い、URLは `src/app/` のディレクトリ構成で表現する。
- `page.tsx` はそのURLで表示するページを定義する。
- `layout.tsx` は共通レイアウトを定義する。
- `src/app/` には具体的なUIや業務ロジックを詰め込まない。
- 機能の中身は `src/features/[feature_name]/` から読み込む。
- `/` はLPとして使い、`/dashboard` は教師向けの概要ページとして使い、ルーム管理は `/rooms/...` にまとめる。
- 動的ルートでは `[roomId]` や `[inviteCode]` のように、意味がわかる名前を使う。

## 2. Next.js 16 での注意点

このプロジェクトの Next.js では、動的ルートの `params` や `searchParams` は Promise として扱います。

```tsx
export default async function Page({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  return <div>{roomId}</div>;
}
```

`params` を同期的に読む書き方は避けます。

## 3. ルート一覧

### 3.1 `/`

サービスのトップページ（LP）です。

| 項目 | 内容 |
| :--- | :--- |
| ファイル | `src/app/page.tsx` |
| 主な利用者 | 未ログインの教師、サービス利用前のユーザー |
| 認証 | 不要 |
| 主な内容 | q-tool の概要、教師ログイン導線、学生入室導線 |

### 3.2 `/login`

教師のログイン・新規登録画面です。

| 項目 | 内容 |
| :--- | :--- |
| ファイル | `src/app/login/page.tsx` |
| 主な利用者 | 教師 |
| 認証 | 未ログインでも閲覧可能 |
| 主な内容 | Firebase Authentication によるログイン、新規登録 |

### 3.3 `/dashboard`

教師向けのダッシュボードです。

| 項目 | 内容 |
| :--- | :--- |
| ファイル | `src/app/dashboard/page.tsx` |
| 主な利用者 | 教師 |
| 認証 | 教師ログインが必要 |
| 主な内容 | ログイン状態、最近のルーム、ルーム作成導線 |

### 3.3.1 `/dashboard/profile`

教師プロフィールの編集画面です。

| 項目 | 内容 |
| :--- | :--- |
| ファイル | `src/app/dashboard/profile/page.tsx` |
| 主な利用者 | 教師 |
| 認証 | 教師ログインが必要 |
| 主な内容 | ユーザー名、所属、担当授業科目、連絡用URL、自己紹介の表示・編集 |

### 3.4 `/rooms`

教師が自分のルーム一覧を確認する画面です。

| 項目 | 内容 |
| :--- | :--- |
| ファイル | `src/app/rooms/page.tsx` |
| 主な利用者 | 教師 |
| 認証 | 教師ログインが必要 |
| 主な内容 | 自分が作成したルーム一覧、開講状態、質問数、詳細画面へのリンク |

### 3.5 `/rooms/new`

ルーム新規作成画面です。

| 項目 | 内容 |
| :--- | :--- |
| ファイル | `src/app/rooms/new/page.tsx` |
| 主な利用者 | 教師 |
| 認証 | 教師ログインが必要 |
| 主な内容 | ルーム名入力、招待コード/PIN生成、Firestore保存 |

### 3.6 `/rooms/[roomId]`

特定ルームの教師向け詳細画面です。

| 項目 | 内容 |
| :--- | :--- |
| ファイル | `src/app/rooms/[roomId]/page.tsx` |
| 主な利用者 | 教師 |
| 認証 | ルーム作成者の教師ログインが必要 |
| 主な内容 | ルーム情報、開講状態、セクション管理、質問数 |

### 3.7 `/rooms/[roomId]/invite`

特定ルームの招待情報を表示する画面です。

| 項目 | 内容 |
| :--- | :--- |
| ファイル | `src/app/rooms/[roomId]/invite/page.tsx` |
| 主な利用者 | 教師 |
| 認証 | ルーム作成者の教師ログインが必要 |
| 主な内容 | 学生入室用URL、QRコード、短い英数字PIN、コピー操作 |

### 3.8 `/rooms/[roomId]/summaries`

特定ルームのAI要約履歴を表示する画面です。

| 項目 | 内容 |
| :--- | :--- |
| ファイル | `src/app/rooms/[roomId]/summaries/page.tsx` |
| 主な利用者 | 教師 |
| 認証 | ルーム作成者の教師ログインが必要 |
| 主な内容 | セクション終了後に生成されたAI要約の一覧 |

### 3.9 `/join`

学生がPINを入力してルームに入室する画面です。

| 項目 | 内容 |
| :--- | :--- |
| ファイル | `src/app/join/page.tsx` |
| 主な利用者 | 学生 |
| 認証 | 不要 |
| 主な内容 | 短い英数字PINの入力、ルーム検索 |

### 3.10 `/join/[inviteCode]`

QRコードまたは共有URLからアクセスする学生用入室画面です。

| 項目 | 内容 |
| :--- | :--- |
| ファイル | `src/app/join/[inviteCode]/page.tsx` |
| 主な利用者 | 学生 |
| 認証 | 不要 |
| 主な内容 | 招待コード/PINからルームを取得し、入室確認へ進む |

### 3.11 `/rooms/[roomId]/chat`

学生が質問を投稿・閲覧する画面です。

| 項目 | 内容 |
| :--- | :--- |
| ファイル | `src/app/rooms/[roomId]/chat/page.tsx` |
| 主な利用者 | 学生 |
| 認証 | 不要 |
| 主な内容 | 質問投稿、質問一覧、リアクション |

学生はログインしないため、ブラウザごとの `student_session_id` を使って識別します。

## 4. URL命名ルール

- `/` はLPとして使う。
- `/dashboard` は教師向けの概要ページにする。
- 教師向けのルーム管理は `/rooms/...` にまとめる。
- 学生の入室開始は `/join` にまとめる。
- 学生が実際に質問する画面は `/rooms/[roomId]/chat` に置く。
- URLに表示する動的値は、Firestore のドキュメントIDまたは招待コード/PINを使う。
- 日本語URLは使わず、英小文字・数字・ハイフンを基本にする。

## 5. `src/app` と `features` の分担

`src/app` のページは、ルート固有の薄いラッパーにします。

```tsx
import { RoomDetail } from "@/features/room/components/RoomDetail";

export default async function Page(
  props: PageProps<"/rooms/[roomId]">,
) {
  const { roomId } = await props.params;

  return <RoomDetail roomId={roomId} />;
}
```

Firestoreの取得、フォームの状態管理、エラー表示などは `features/room` 側に置きます。

## 6. 認証・権限の考え方

- 教師向けページは Firebase Authentication のログイン状態を確認する。
- ルーム詳細では、`rooms/{roomId}.teacher_id` とログイン中ユーザーの `uid` が一致することを確認する。
- 学生向けページはログイン不要とし、PINまたは招待URLから入室する。
- 学生の識別には LocalStorage 等で保持する `student_session_id` を使う。

## 7. 導線

### 教師

```text
/ -> /login -> /dashboard -> /rooms -> /rooms/[roomId]
```

ルーム作成時:

```text
/dashboard -> /rooms/new -> /rooms/[roomId]
```

プロフィール編集:

```text
/dashboard -> /dashboard/profile
```

招待表示:

```text
/rooms/[roomId] -> /rooms/[roomId]/invite
```

### 学生

PIN入力:

```text
/ -> /join -> /join/[inviteCode] -> /rooms/[roomId]/chat
```

QRコードまたは共有URL:

```text
/join/[inviteCode] -> /rooms/[roomId]/chat
```

## 8. 今後追加を検討するルート

- `/rooms/[roomId]/sections/[sectionId]`: セクション詳細を独立させる場合
- `/rooms/[roomId]/summaries/[summaryId]`: 要約結果を独立画面で表示する場合
- `/archive`: 授業後アーカイブ機能を追加する場合

これらはMVPでは必須ではありません。必要になった時点で追加します。
