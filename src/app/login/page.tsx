import { AuthForm } from "@/features/auth/components/AuthForm";
import type { AuthMode } from "@/features/auth/hooks/useAuthForm";

type LoginPageProps = {
  searchParams: Promise<{
    mode?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { mode } = await searchParams;
  const initialMode: AuthMode = mode === "signup" ? "signup" : "login";

  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-10">
      <AuthForm initialMode={initialMode} />
    </main>
  );
}
