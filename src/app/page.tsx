import { getAuthToken } from "@/features/auth/actions";
import { LandingPage } from "@/features/landing/components/LandingPage";

export default async function Home() {
  const authToken = await getAuthToken();

  return <LandingPage isLoggedIn={Boolean(authToken)} />;
}
