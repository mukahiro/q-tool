import Link from "next/link";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { BrandLogo } from "./BrandLogo";

type SiteHeaderProps = {
  isLoggedIn: boolean;
};

export function SiteHeader({ isLoggedIn }: SiteHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white text-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <BrandLogo className="w-32 sm:w-36" priority />

        <nav
          aria-label="グローバルナビゲーション"
          className="flex flex-wrap items-center gap-3"
        >
          {isLoggedIn ? (
            <>
              <HeaderLink href="/dashboard">ダッシュボード</HeaderLink>
              <HeaderLink href="/rooms/new" primary>
                作成
              </HeaderLink>
              <LogoutButton />
            </>
          ) : (
            <>
              <HeaderLink href="/login">ログイン</HeaderLink>
              <HeaderLink href="/login?mode=signup" primary>
                登録
              </HeaderLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function HeaderLink({
  children,
  href,
  primary = false,
}: {
  children: React.ReactNode;
  href: string;
  primary?: boolean;
}) {
  const className = primary
    ? "bg-slate-950 text-white hover:bg-slate-800"
    : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50";

  return (
    <Link
      href={href}
      className={`inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition ${className}`}
    >
      {children}
    </Link>
  );
}
