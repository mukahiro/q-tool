import type { Metadata } from "next";
import { JoinForm } from "@/features/join/components/JoinForm";

export const metadata: Metadata = {
  title: "ルームに入室 | Q Tool",
  description: "PINコードを入力して授業ルームへ入室します。",
};

export default function JoinPage() {
  return <JoinForm />;
}