import Image from "next/image";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CopyInviteUrlButton } from "./CopyInviteUrlButton";

type RoomInviteViewProps = {
  roomId: string;
  roomName: string;
  inviteCode: string;
  isActive: boolean;
  inviteUrl: string;
  qrCodeDataUrl: string;
};

export function RoomInviteView({
  roomId,
  roomName,
  inviteCode,
  isActive,
  inviteUrl,
  qrCodeDataUrl,
}: RoomInviteViewProps) {
  return (
    <main className="flex-1 bg-slate-50 px-4 py-8 text-slate-950">
      <div className="mx-auto w-full max-w-6xl">
        <header className="border-b border-slate-200 pb-6">
          <Breadcrumbs
            items={[
              { label: "ダッシュボード", href: "/dashboard" },
              { label: "ルーム一覧", href: "/rooms" },
              { label: roomName, href: `/rooms/${roomId}` },
            ]}
          />
          <h1 className="mt-1 text-3xl font-semibold">学生入室用QR・PIN</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="text-lg font-medium text-slate-800">
              {roomName}
            </p>
            <span
              className={
                isActive
                  ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                  : "rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
              }
            >
              {isActive ? "開講中" : "終了"}
            </span>
          </div>
        </header>

        {!isActive && (
          <div className="rounded-lg border border-rose-50 bg-rose-50 p-4 text-sm text-rose-700 mt-6">
            このルームは終了済みです。新しく質問の投稿をすることはできません。
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">

          <section className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
            <h2 className="text-lg font-semibold">QRコード</h2>
            <p className="mt-2 text-sm text-slate-600">
              学生用入室URLを表示しています。スマホ等のカメラで読み取ってください。
            </p>

            <div className="mt-6 flex flex-col items-center">
              <Image
                src={qrCodeDataUrl}
                alt={`${roomName}の学生入室用QRコード`}
                width={320}
                height={320}
                unoptimized
                priority
                className="h-auto w-full max-w-80 rounded-md border border-slate-200"
              />

              <a
                href={qrCodeDataUrl}
                download={`q-tool-${inviteCode}.png`}
                className="mt-4 inline-flex w-full max-w-80 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                QRコード画像を保存
              </a>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-center">
              <h2 className="text-lg font-semibold">PINコード</h2>
              <p className="mt-2 text-sm text-slate-600">
                QRコードを読み取れない場合に使用します。全て半角英数字で入力してください。
              </p>

              <p className="mt-8 break-all font-mono text-6xl font-bold tracking-[0.2em] text-slate-950 sm:text-8xl">
                {inviteCode}
              </p>
            </div>

            <div className="mt-10 border-t border-slate-200 pt-6">
              <h2 className="text-sm font-semibold text-slate-700">
                学生用入室URL
              </h2>

              <a
                href={inviteUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 block break-all rounded-md bg-slate-100 p-3 text-sm text-slate-800 underline-offset-4 hover:underline"
              >
                {inviteUrl}
              </a>

              <div className="mt-4">
                <CopyInviteUrlButton inviteUrl={inviteUrl} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
