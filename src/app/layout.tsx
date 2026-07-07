import type { Metadata } from "next";
import { getAuthToken } from "@/features/auth/actions";
import { AuthStateSync } from "@/features/auth/components/AuthStateSync";
import "./globals.css";

export const metadata: Metadata = {
  title: "Q Tool",
  description: "学生と教師をつなぐリアルタイム質問ツール",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authToken = await getAuthToken();

  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthStateSync initialHasAuthToken={Boolean(authToken)} />
        {children}
      </body>
    </html>
  );
}
