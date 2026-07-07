import type { Metadata } from "next";
import { AuthStateSync } from "@/features/auth/components/AuthStateSync";
import "./globals.css";

export const metadata: Metadata = {
  title: "Q Tool",
  description: "学生と教師をつなぐリアルタイム質問ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthStateSync />
        {children}
      </body>
    </html>
  );
}
