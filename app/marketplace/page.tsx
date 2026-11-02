import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { MarketplaceCatalog } from "./MarketplaceCatalog";

export default async function PublicMarketplacePage() {
  const session = await getSession();
  if (session) redirect("/dashboard/marketplace");

  return <MarketplaceCatalog basePath="/marketplace" />;
}
