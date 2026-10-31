import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, MessageSquare } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getProfileById } from "@/lib/profiles";
import { getDashboardSummary } from "@/app/actions/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { STATUS_META, formatDate } from "./ui-helpers";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [summary, profile] = await Promise.all([
    getDashboardSummary(),
    getProfileById(session.userId),
  ]);

  const stats = [
    { label: "En progreso", value: summary.inProgress, href: "/dashboard/orders?tab=progreso" },
    { label: "Pedidos hechos", value: summary.done, href: "/dashboard/orders?tab=hechos" },
    { label: "Total de pedidos", value: summary.total, href: "/dashboard/orders?tab=todos" },
  ];

  return (
    <main className="px-4 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          Hola{profile?.fullName ? `, ${profile.fullName.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="mt-2 text-muted-foreground">
          Seguí tus servicios, tus pedidos y hablá con el equipo desde un solo lugar.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <Link key={stat.label} href={stat.href} className="group">
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="flex flex-col gap-1">
                  <p className="text-3xl font-semibold tracking-tight">{stat.value}</p>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    {stat.label}
                    <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-10">
          <div className="flex items-center justify-between gap-4 border-b border-foreground/10 pb-3">
            <h2 className="text-lg font-semibold tracking-tight">Pedidos recientes</h2>
            <Button render={<Link href="/dashboard/servicios" />} nativeButton={false} variant="outline" size="sm">
              Pedir un servicio
            </Button>
          </div>

          {summary.recent.length === 0 ? (
            <div className="rounded-xl border border-dashed px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Todavía no pediste ningún servicio. Explorá el catálogo y contanos qué necesitás.
              </p>
              <Button render={<Link href="/dashboard/servicios" />} nativeButton={false} size="sm" className="mt-4">
                Ver servicios
              </Button>
            </div>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {summary.recent.map((order) => (
                <li key={order.id}>
                  <Card>
                    <CardContent className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{order.serviceTitle}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {formatDate(order.createdAt)} · {order.message.slice(0, 80)}
                          {order.message.length > 80 ? "…" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={STATUS_META[order.status].className}>
                          {STATUS_META[order.status].label}
                        </Badge>
                        <Button
                          render={<Link href={`/dashboard/chats/${order.id}`} />}
                          nativeButton={false}
                          variant="ghost"
                          size="sm"
                        >
                          <MessageSquare className="size-4" />
                          Chat
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
