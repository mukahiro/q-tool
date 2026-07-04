import type { Metadata } from "next";
import { StudentChatView } from "@/features/room/components/StudentChatView";

type Props = {
  params: Promise<{ roomId: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ルームチャット | Q Tool",
  description: "学生が質問を投稿する画面です",
};

export default async function StudentChatPage({ params }: Props) {
  const { roomId } = await params;

  return <StudentChatView roomId={roomId} />;
}
