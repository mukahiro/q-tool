import Image from "next/image";
import Link from "next/link";
import { CopyInviteUrlButton } from "./CopyInviteUrlButton";

type RoomInviteViewProps = {
  roomId: string;
  roomName: string;
  inviteCode: string;
  inviteUrl: string;
  qrCodeDataUrl: string;
};

export function RoomInviteView({
  roomId,
  roomName,
  inviteCode,
  inviteUrl,
  qrCodeDataUrl,
}: RoomInviteViewProps) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950">
      <div className="mx-auto w-full max-w-5xl">
        <Link
          href={`/rooms/${roomId}`}
          className="text-sm font-medium text-slate-600 underline-offset-4 hover:underline"
        >
          ルーム詳細へ戻る
        </Link>

        <header className="mt-6 border-b border-slate-200 pb-6">
          <p className="text-sm font-semibold text-emerald-700">Q Tool</p>
          <h1 className="mt-1 text-3xl font-semibold">学生入室用QR・PIN</h1>
          <p className="mt-3 text-lg font-medium text-slate-800">
            {roomName}
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            学生にQRコードを読み取ってもらうか、PINコードを入力してもらってください。
          </p>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
            <h2 className="text-lg font-semibold">QRコード</h2>
            <p className="mt-2 text-sm text-slate-600">
              学生用入室URLを表示しています。
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
                QRコードを読み取れない場合に使用します。
              </p>

              <p className="mt-8 break-all font-mono text-5xl font-bold tracking-[0.2em] text-slate-950 sm:text-6xl">
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
