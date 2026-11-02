import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ServiceDetailContent } from "./ServiceDetailContent";

export default async function PublicMarketplaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (session) redirect(`/dashboard/marketplace/${id}`);

  return <ServiceDetailContent id={id} basePath="/marketplace" isAuthenticated={false} />;
}
