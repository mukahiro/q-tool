import type { Metadata } from "next";
import { forbidden, notFound } from "next/navigation";
import QRCode from "qrcode";
import { getVerifiedTeacherFromAuthCookie } from "@/features/auth/utils/server";
import { RoomInviteView } from "@/features/room/components/RoomInviteView";
import { buildJoinUrl } from "@/features/room/utils/joinUrl";
import { getOwnedRoomInvite } from "@/features/room/utils/roomInvite";

type RoomInvitePageProps = {
  params: Promise<{
    roomId: string;
  }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "学生入室用QR・PIN | Q Tool",
  description: "学生入室用のQRコード、URL、PINコードを表示します。",
};

export default async function RoomInvitePage({
  params,
}: RoomInvitePageProps) {
  const { roomId } = await params;

  const teacher = await getVerifiedTeacherFromAuthCookie();

  if (!teacher) {
    forbidden();
  }

  const result = await getOwnedRoomInvite({
    roomId,
    teacherId: teacher.uid,
    idToken: teacher.idToken,
  });

  if (result.status === "not-found") {
    notFound();
  }

  if (result.status === "forbidden") {
    forbidden();
  }

  const inviteUrl = await buildJoinUrl(result.room.inviteCode);

  const qrCodeDataUrl = await QRCode.toDataURL(inviteUrl, {
    width: 320,
    margin: 2,
    errorCorrectionLevel: "M",
  });

  return (
    <RoomInviteView
      roomId={result.room.id}
      roomName={result.room.name}
      inviteCode={result.room.inviteCode}
      isActive={result.room.isActive}
      inviteUrl={inviteUrl}
      qrCodeDataUrl={qrCodeDataUrl}
    />
  );
}
