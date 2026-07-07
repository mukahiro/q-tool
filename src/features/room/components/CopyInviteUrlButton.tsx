"use client";

import { useState } from "react";

type CopyStatus = "idle" | "copied" | "failed";

type CopyInviteUrlButtonProps = {
  inviteUrl: string;
};

export function CopyInviteUrlButton({
  inviteUrl,
}: CopyInviteUrlButtonProps) {
  const [status, setStatus] = useState<CopyStatus>("idle");

  async function handleCopy() {
    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard API is not available.");
      }

      await navigator.clipboard.writeText(inviteUrl);
      setStatus("copied");
    } catch (error) {
      console.error("Failed to copy invite URL:", error);
      setStatus("failed");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex w-full items-center justify-center rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        入室URLをコピー
      </button>

      {status === "copied" ? (
        <p
          role="status"
          aria-live="polite"
          className="mt-2 text-center text-sm font-medium text-emerald-700"
        >
          コピーしました。
        </p>
      ) : null}

      {status === "failed" ? (
        <p
          role="alert"
          className="mt-2 text-center text-sm font-medium text-rose-700"
        >
          コピーできませんでした。URLを直接選択してコピーしてください。
        </p>
      ) : null}
    </div>
  );
}
