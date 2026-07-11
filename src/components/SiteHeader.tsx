import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import { SiteHeaderUserMenu } from "./SiteHeaderUserMenu";

type SiteHeaderProps = {
  isLoggedIn: boolean;
};

export function SiteHeader({ isLoggedIn }: SiteHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white text-slate-950">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <BrandLogo className="w-28 sm:w-36" priority />

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {isLoggedIn ? (
            <>
              <nav
                aria-label="グローバルナビゲーション"
                className="hidden items-center gap-3 sm:flex"
              >
                <HeaderLink href="/dashboard">ダッシュボード</HeaderLink>
                <HeaderLink href="/rooms/new" primary>ルーム作成</HeaderLink>
              </nav>
              <SiteHeaderUserMenu />
            </>
          ) : (
            <nav
              aria-label="グローバルナビゲーション"
              className="flex items-center gap-2 sm:gap-3"
            >
              <HeaderLink href="/login">ログイン</HeaderLink>
              <HeaderLink href="/login?mode=signup" primary>
                登録
              </HeaderLink>
            </nav>
          )}
        </div>
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
      className={`inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition sm:px-4 ${className}`}
    >
      {children}
    </Link>
  );
}
