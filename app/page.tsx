import MarketplaceLayout from "./marketplace/layout";
import MarketplacePage from "./marketplace/page";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <MarketplaceLayout>
      <MarketplacePage />
    </MarketplaceLayout>
  );
}
