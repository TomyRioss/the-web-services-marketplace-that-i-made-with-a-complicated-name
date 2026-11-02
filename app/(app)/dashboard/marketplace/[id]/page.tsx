import { ServiceDetailContent } from "@/app/marketplace/[id]/ServiceDetailContent";

export default async function DashboardMarketplaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ServiceDetailContent id={id} basePath="/dashboard/marketplace" isAuthenticated />;
}
