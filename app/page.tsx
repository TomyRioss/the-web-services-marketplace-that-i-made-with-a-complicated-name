import MarketplaceLayout from "./marketplace/layout";
import HomePage from "./HomePage";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <MarketplaceLayout compactForPromo>
      <HomePage />
    </MarketplaceLayout>
  );
}
