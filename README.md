# q-tool (学生と教師をつなぐリアルタイム質問ツール)

Next.js, Firebase, Gemini API を活用した、授業中の質問収集・要約ツールです。

## プロジェクトドキュメント

開発にあたっての設計や方針は以下のドキュメントを参照してください。

- [技術スタックの検討と決定 (docs/tech-stack.md)](docs/tech-stack.md)
- [要件定義書 (docs/requirements.md)](docs/requirements.md)
- [データベース設計書 (docs/database-design.md)](docs/database-design.md)
- [ルーティング設計書 (docs/routing.md)](docs/routing.md)
- [アーキテクチャとチーム開発の方針 (docs/architecture-strategy.md)](docs/architecture-strategy.md)

## ディレクトリ構成

本プロジェクトの全体像です。基本的に触る部分は`/src`ディレクトリ内です。

```text
/
├── docs/              # 設計・要件定義などのドキュメント
├── public/            # 静的アセット（画像、アイコンなど）
├── src/               # ソースコード
│   ├── app/           # ページルーティングとレイアウト
│   ├── features/      # メインの開発場所（機能ごとに分割）
│   │   ├── room/      # ルーム管理
│   │   ├── question/  # 質問投稿・表示
│   │   ├── summary/   # AI要約
│   │   …
│   ├── components/    # 全体で共有する汎用UI
│   ├── lib/           # 外部サービス設定（Supabase, Gemini等）
│   └── types/         # 共通の型定義
├── AGENTS.md          # AIエージェント向けの指示書
├── CLAUDE.md          # Claude向けの指示書
├── .gitignore         # Git管理除外設定
├── eslint.config.mjs  # ESLintの設定
├── next.config.ts     # Next.jsの設定
├── postcss.config.mjs # PostCSSの設定
├── package.json       # 依存ライブラリ・スクリプトの管理
├── package-lock.json  # 依存ライブラリのバージョン固定
└── tsconfig.json      # TypeScriptの設定
```

## 開発の始め方

### 環境設定

自分のPCにクローンします。

```bash
git clone git@github.com:mukahiro/q-tool.git
```

依存関係をインストールします。

```bash
npm install
```

開発サーバーを起動します。

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開き、結果を確認してください。

### 作業の流れ

初めに、リモートリポジトリが更新されている可能性があるのでpullする。

```bash
git switch main
git pull
```

新しい作業ブランチを作成して、そこで作業する。  
ブランチ名は`feature/ブランチ名`とし、英字とハイフンで書く。

```bash
git switch -c feature/branch-name
```

作業の一区切りごとにコミットする。

```bash
git commit
```

全ての作業が完了したら、GitHubに移動して、そのブランチのプルリクエスト(feature/branch-name -> main)を作成する。

## プルリクエストのテンプレート

mainブランチへの直接プッシュは許可されていないので、必ずプルリクエストを作成してください。  
プルリクエストを作成する際は、以下のテンプレートをコピーして概要欄に貼り付けてください。

```markdown
## 概要
(今回の変更の目的や、解決する課題を簡潔に書いてください)

## 実装内容
- (行った変更を箇条書きで書いてください)
- 
- 

## 動作確認
- [ ] ローカル環境で `npm run dev` を実行し、正しく動作することを確認した
- [ ] `npm run lint` を実行し、エラーがないことを確認した
- [ ] (その他、確認した項目があれば追記してください)

## 相談・メモ
(実装で迷った点や、レビューで特に見てほしい点があれば書いてください)
```
