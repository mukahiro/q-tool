import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
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
      <body className="flex min-h-dvh flex-col">
        <AuthStateSync initialHasAuthToken={Boolean(authToken)} />
        <SiteHeader isLoggedIn={Boolean(authToken)} />
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
