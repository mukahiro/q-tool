"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { LogoutButton } from "@/features/auth/components/LogoutButton";

export function SiteHeaderUserMenu() {
  const [isOpen, setIsOpen] = useState(false);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-controls="user-header-menu"
        aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
        className="inline-flex size-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
      >
        {isOpen ? (
          <X aria-hidden="true" className="size-5" />
        ) : (
          <Menu aria-hidden="true" className="size-5" />
        )}
      </button>

      {isOpen ? (
        <div
          id="user-header-menu"
          className="absolute right-0 top-12 z-20 w-60 rounded-md border border-slate-200 bg-white p-2 shadow-lg"
        >
          <nav
            aria-label="ユーザーメニュー"
            className="flex flex-col gap-2"
          >
            <MenuLink
              href="/dashboard"
              onClick={closeMenu}
              className="sm:hidden"
            >
              ダッシュボード
            </MenuLink>
            <MenuLink
              href="/rooms/new"
              onClick={closeMenu}
              className="sm:hidden"
            >
              ルーム作成
            </MenuLink>
            <MenuLink href="/dashboard/profile" onClick={closeMenu}>
              プロフィール編集
            </MenuLink>
            <MenuLink href="/join" onClick={closeMenu}>
              ルーム参加
            </MenuLink>
            <LogoutButton
              wrapperClassName="w-full"
              className="w-full justify-start"
            />
          </nav>
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  children,
  className = "",
  href,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  href: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`inline-flex min-h-10 items-center rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 ${className}`}
    >
      {children}
    </Link>
  );
}
