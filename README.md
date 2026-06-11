# q-tool (学生と教師をつなぐリアルタイム質問ツール)

Next.js, Supabase, Prisma, Gemini API を活用した、授業中の質問収集・要約ツールです。

## プロジェクトドキュメント

開発にあたっての設計や方針は以下のドキュメントを参照してください。

- [技術スタックの検討と決定 (docs/tech-stack.md)](docs/tech-stack.md)
- [要件定義書 (docs/requirements.md)](docs/requirements.md)
- [データベース設計書 (docs/database-design.md)](docs/database-design.md)
- [アーキテクチャとチーム開発の方針 (docs/architecture-strategy.md)](docs/architecture-strategy.md)

## 開発の始め方

まず、開発サーバーを起動します。

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開き、結果を確認してください。

`src/app/page.tsx` を編集して開発を開始できます。ファイルを編集すると、ページが自動的に更新されます。

## Vercel へのデプロイ

このプロジェクトは [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) にデプロイするように最適化されています。
詳細は [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) を参照してください。
