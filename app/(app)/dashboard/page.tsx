import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowRight, Clock3, MessageSquare } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getOrders } from "@/app/actions/dashboard";
import { getDashboardAd } from "@/app/actions/dashboard-ads";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STATUS_META, formatDate } from "./ui-helpers";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [orders, dashboardAdResult] = await Promise.all([
    getOrders("progreso"),
    getDashboardAd(),
  ]);
  const dashboardAd = dashboardAdResult ?? [];

  return (
    <main className="flex min-h-full w-full flex-1 flex-col px-4 pt-4 pb-10 sm:px-8 sm:pt-6 sm:pb-14">
      <div className="flex w-full max-w-none flex-1 flex-col">
        {dashboardAd.length > 0 && (
          <div className="mb-8 flex w-full flex-wrap items-start justify-start gap-3">
            {dashboardAd.map((ad) => (
              <Link
                key={ad.slot}
                href={ad.href}
                aria-label={`Abrir anuncio: ${ad.title}`}
                className="group flex w-fit justify-start rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Image
                  src={ad.imageUrl}
                  alt={ad.title}
                  width={1536}
                  height={1024}
                  preload={ad.slot === "home"}
                  unoptimized
                  className="h-[min(25vw,128px)] w-auto max-w-full rounded-xl object-contain transition-transform duration-200 group-hover:scale-[1.01]"
                />
              </Link>
            ))}
          </div>
        )}

        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-foreground/10 pb-5">
          <div>
            <h1 className="font-heading text-lg tracking-tight sm:text-xl">Pedidos activos</h1>
          </div>
          <Button render={<Link href="/dashboard/servicios" />} nativeButton={false} variant="outline" size="sm">
            Nuevo pedido
            <ArrowRight className="size-4" />
          </Button>
        </header>

        {orders.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-dashed border-foreground/20 bg-card/50 px-6 py-14 text-center">
            <Clock3 aria-hidden="true" className="mx-auto size-8 text-accent-green" />
            <h2 className="mt-4 text-lg font-semibold">No tenés pedidos activos</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Cuando solicites un servicio, acá vas a poder seguir cada etapa y conversar con el equipo.
            </p>
            <Button render={<Link href="/dashboard/servicios" />} nativeButton={false} className="mt-5 font-heading text-[10px]">
              Ver servicios
            </Button>
          </section>
        ) : (
          <section aria-label="Pedidos activos" className="mt-2">
            <ul className="divide-y divide-foreground/10">
              {orders.map((order) => {
                return (
                  <li key={order.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="truncate font-medium">{order.serviceTitle}</h2>
                        <Badge className={STATUS_META[order.status].className}>
                          {STATUS_META[order.status].label}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Iniciado el {formatDate(order.createdAt)} · Actualizado {formatDate(order.updatedAt)}
                      </p>
                      {order.message && (
                        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                          {order.message.split("\n\nEnlaces de referencia:")[0]}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/dashboard/chats/${order.id}`}
                      className="inline-flex shrink-0 items-center gap-2 rounded-md bg-accent-green px-3 py-2 text-sm font-medium text-black transition-opacity hover:opacity-85"
                    >
                      <MessageSquare aria-hidden="true" className="size-4" />
                      Chat
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
