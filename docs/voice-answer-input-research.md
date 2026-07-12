# 先生回答の音声入力機能 調査メモ

作成日: 2026-07-12

## 1. 結論

先生がAI要約を見ながら、口頭回答の内容を音声入力でテキスト化し、授業後の記録として保存する機能は実装可能です。

ただし、MVPで実用に耐えやすいのは「音声入力を補助入力として使い、最後に先生がテキストを確認・編集して保存する」形です。授業中の発話を常時録音して完全な議事録を作る用途や、すべてのブラウザで同じ品質を保証する用途には、ブラウザ内蔵APIだけでは不十分です。

推奨方針は次の通りです。

1. MVPでは Web Speech API を使ったブラウザ内音声入力を試作する。
2. 音声入力が使えない環境でも、通常のテキスト入力で回答を保存できるようにする。
3. 本番で学校端末や複数ブラウザへの安定対応が必要になった段階で、Google Cloud Speech-to-Text への移行を検討する。
4. Gemini の音声理解は「録音済み音声の文字起こし・要約」には使えるが、リアルタイム音声入力の第一候補にはしない。

## 2. 実現したい体験

現在の q-tool は、学生の質問を受け付け、セクション終了時にAI要約して、先生が口頭で回答しやすくする構成です。ここに次の体験を追加します。

1. 先生がセクション終了後のAI要約を見る。
2. 「回答を記録」ボタンを押す。
3. マイクで話した内容がテキスト欄へ入力される。
4. 先生が必要に応じて修正する。
5. 回答テキストを保存する。
6. 授業後に「質問要約」と「先生の回答」をセットで見返せる。

この体験では、音声認識の結果が多少崩れても、保存前に先生が直せます。そのため、完全自動の文字起こしより現実的です。

## 3. 技術候補

### 3.1 Web Speech API

ブラウザの `SpeechRecognition` を使う方法です。MDNでは、Web Speech API は音声認識と音声合成を扱うAPIとして説明されています。

参考:
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
- https://developer.chrome.com/blog/voice-driven-web-apps-introduction-to-the-web-speech-api
- https://caniuse.com/speech-recognition

メリット:

- フロントエンドだけで試作しやすい。
- 追加のクラウド課金が不要。
- `interimResults` を使うと、話している途中の仮テキストも表示できる。
- `lang = "ja-JP"` を指定して日本語入力に寄せられる。

注意点:

- MDNでは `SpeechRecognition` は Baseline ではなく、広く使われる一部ブラウザで動かない機能とされています。
- Can I use の2026年6月時点データでは、Chrome と Safari は部分対応、Firefox は標準では無効、Edge は非対応扱いです。
- Chrome など一部ブラウザでは音声がサーバー側の認識エンジンへ送られるため、オフラインでは動かない場合があります。
- ブラウザやOS、マイク品質、教室の騒音で認識品質が変わります。

q-toolでの評価:

- 「まず使える形を試す」には向いています。
- 「この機能が使えないと授業が成立しない」設計には向きません。
- PC版Chrome、iPad/Safariなど、実際に想定する学校環境で検証が必要です。

### 3.2 Google Cloud Speech-to-Text

Google Cloud の音声認識APIを使う方法です。Cloud Speech-to-Text は音声を送信して文字起こしを受け取るサービスで、ストリーミング入力にも対応しています。

参考:
- https://cloud.google.com/speech-to-text/docs
- https://cloud.google.com/speech-to-text/v2/docs/speech-to-text-supported-languages
- https://cloud.google.com/speech-to-text/pricing

メリット:

- 専用の音声認識サービスなので、ブラウザ内蔵APIより本番運用の設計がしやすい。
- 日本語 `ja-JP` がサポートされています。
- 自動句読点、モデル適応、信頼度、話者分離など、モデル・リージョンによって使える機能があります。
- ブラウザ差を吸収しやすい。

注意点:

- 音声をサーバーへ送る構成が必要です。
- API料金が発生します。2026年7月時点のV2標準認識は、月50万分まで $0.016 / 分です。
- APIキーやサービスアカウントをクライアントへ出さない設計が必要です。
- Vercel Functions だけで長時間ストリーミングを扱う場合は制約が出る可能性があるため、Cloud Run などの常駐バックエンドも検討対象になります。

q-toolでの評価:

- 本番で安定した音声入力を提供したい場合の第一候補です。
- MVP段階では実装量と運用コストが大きいため、Web Speech API で価値検証してから移行するのが安全です。

### 3.3 Gemini の音声理解

Gemini API は音声ファイルを入力として受け取り、文字起こし・要約・話者分離などの応答を生成できます。

参考:
- https://ai.google.dev/gemini-api/docs/audio
- https://ai.google.dev/gemini-api/docs/live

メリット:

- 既存のAI要約と同じGoogle系の技術として扱いやすい。
- 音声を文字起こしするだけでなく、要点整理や整形まで一度に行える。
- 録音済み音声の後処理には向いています。

注意点:

- Gemini公式ドキュメントでも、リアルタイム文字起こしには専用の Google Cloud Speech-to-Text API が案内されています。
- Gemini Live API は低遅延の音声対話に使えますが、2026年7月時点では Preview です。
- 先生の回答を「入力欄へリアルタイムに反映する」用途では、Speech-to-Text 専用サービスの方が設計しやすいです。

q-toolでの評価:

- 「録音した回答を後から要約・整形する」追加機能には有力です。
- 「回答欄に音声で入力する」MVPの主役にはしません。

## 4. 推奨アーキテクチャ

### 4.1 MVP案

MVPでは、`features/answer` を新設し、回答記録を独立した機能として扱います。

```text
src/features/answer/
├── actions.ts
├── components/
│   ├── AnswerRecorder.tsx
│   └── AnswerTextForm.tsx
├── hooks/
│   └── useSpeechRecognition.ts
├── types.ts
└── utils/
    └── speechRecognition.ts
```

画面側では、AI要約結果の近くに「回答を記録」UIを置きます。`src/app/` は薄いページラッパーのままにし、音声入力や保存処理は `features/answer` に閉じ込めます。

音声入力の流れ:

1. ブラウザが `SpeechRecognition` または `webkitSpeechRecognition` を持つか確認する。
2. 対応していればマイクボタンを有効にする。
3. `lang = "ja-JP"`、`continuous = true`、`interimResults = true` を基本設定にする。
4. 確定テキストを回答欄に追記する。
5. 仮テキストは薄い表示で見せ、確定前であることを分かるようにする。
6. 保存前に先生が編集できる textarea を必ず残す。

非対応ブラウザでは、マイクボタンを出さず、通常のテキスト入力だけを表示します。

### 4.2 本番強化案

音声入力を主要機能にする場合は、Cloud Speech-to-Text を使う構成を検討します。

```text
Browser
  └─ MediaRecorder / Web Audio API で音声取得
      └─ q-tool backend
          └─ Google Cloud Speech-to-Text streaming
              └─ transcript をブラウザへ返す
```

この場合、APIキーをブラウザへ渡さず、サーバー側で認証・課金・ログを管理します。

## 5. データ設計案

回答はAI要約とは別の記録として扱うのが分かりやすいです。`summaries` に直接フィールドを足すより、将来的に複数回の回答、編集履歴、録音後処理を扱いやすくなります。

```text
rooms/{roomId}/answers/{answerId}
```

| フィールド名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | string | ドキュメントID |
| room_id | string | 親ルームID |
| section_id | string / null | 対応するセクションID。授業全体向け回答なら `whole_class` など |
| summary_id | string / null | 対応するAI要約ID |
| teacher_id | string | 回答した教師のUID |
| content | string | 先生が確認・編集して保存した回答本文 |
| raw_transcript | string / null | 音声認識の生テキスト。不要なら保存しない |
| input_method | string | `manual` / `web_speech` / `cloud_speech` / `gemini_audio` |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

まずは `content` と `input_method` を保存できれば十分です。プライバシー面を考えると、音声ファイルそのものはMVPでは保存しない方針が安全です。

## 6. 実用性の判断

### 実用に耐えやすい条件

- 先生が保存前にテキストを確認・編集する。
- 音声入力が失敗しても手入力へ戻れる。
- 対応ブラウザを事前に明示する。
- 教室で外部マイク、ヘッドセット、または端末近くで話す運用にする。
- 回答記録は「正確な逐語録」ではなく「授業後に見返せる回答メモ」と位置づける。

### 実用に耐えにくい条件

- 教室全体の音を拾って、先生と学生の会話を自動で完全記録したい。
- 先生が画面を確認せず、自動保存された文字起こしを正として扱いたい。
- Firefox / Edge / 古い学校端末でも同じ動作を保証したい。
- オフライン環境で使いたい。
- 個人情報や成績に関わる発話を、録音・外部送信の説明なしに扱う。

## 7. プライバシーと同意

音声入力は、通常のテキスト入力より慎重に扱う必要があります。

- マイク開始は先生の明示操作に限定する。
- 録音中であることを画面上で常に表示する。
- 学生の声が入る可能性がある場合は、授業前に説明する。
- MVPでは音声ファイルを保存しない。
- `raw_transcript` も必要がなければ保存しない。
- クラウド音声認識を使う場合は、音声データが外部サービスへ送信されることを利用規約・運用ルールに明記する。

## 8. 実装ステップ案

1. `docs/database-design.md` に `answers` サブコレクションを追加する。
2. `src/features/answer` を追加する。
3. 手入力だけで回答を保存できる Server Action を作る。
4. AI要約表示の近くに回答入力フォームを表示する。
5. Web Speech API 対応ブラウザだけマイクボタンを有効化する。
6. `npm run lint` と `npm run build` で確認する。
7. 実機で Chrome / Safari / iPad / 学校端末の動作を確認する。
8. 認識精度・ブラウザ対応・運用コストを見て Cloud Speech-to-Text への移行判断をする。

## 9. 最終判断

この機能は実装可能です。q-toolの文脈では、音声入力を「先生の回答記録を速く残すための補助」として導入すれば実用性があります。

一方で、ブラウザ内蔵の音声認識に全面依存する設計は危険です。MVPでは Web Speech API と手入力フォールバックで価値検証し、継続利用される見込みが見えたら Cloud Speech-to-Text を使った安定版へ進めるのがよいです。
