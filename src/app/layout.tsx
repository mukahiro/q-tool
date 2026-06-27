import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "q-tool",
  description: "授業中の質問を集める教師向けダッシュボード",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className="h-full antialiased"
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
