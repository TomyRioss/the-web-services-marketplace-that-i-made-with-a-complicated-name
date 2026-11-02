import { redirect } from "next/navigation";
import { getDashboardAdConfig } from "@/app/actions/dashboard-ads";
import { getSession } from "@/lib/auth/session";
import { DashboardAdForm } from "./DashboardAdForm";

export default async function AdminDashboardAdsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "OWNER" && session.role !== "ADMIN") {
    redirect(session.role === "DEV" ? "/admin/chats" : "/admin/orders");
  }

  const ads = await getDashboardAdConfig();

  return (
    <main className="flex-1 overflow-y-auto px-4 py-10 sm:px-8 sm:py-14">
      <div className="w-full max-w-none">
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard Ads</h1>
        <p className="mt-2 text-sm text-muted-foreground">Configurá las imágenes, destinos y visibilidad de los anuncios del dashboard.</p>
        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          {ads.map((ad) => <DashboardAdForm key={ad.slot} ad={ad} />)}
        </div>
      </div>
    </main>
  );
}
