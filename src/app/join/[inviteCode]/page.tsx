import type { Metadata } from "next";
import { JoinByInviteCode } from "@/features/join/components/JoinByInviteCode";

type JoinByInviteCodePageProps = {
  params: Promise<{
    inviteCode: string;
  }>;
};

export const metadata: Metadata = {
  title: "ルームに入室 | Q Tool",
  description: "招待URLから授業ルームへ入室します。",
};

export default async function JoinByInviteCodePage({
  params,
}: JoinByInviteCodePageProps) {
  const { inviteCode } = await params;

  return (
    <JoinByInviteCode
      inviteCode={inviteCode.trim().toUpperCase()}
    />
  );
}