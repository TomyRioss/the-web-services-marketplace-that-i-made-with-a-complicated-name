import Link from "next/link";
import { getOrders, type OrdersTab } from "@/app/actions/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { STATUS_META, formatDate } from "../ui-helpers";
import { TABS, isOrdersTab } from "./tabs";
import { OrderAssignmentStatus } from "../OrderAssignmentStatus";
import { COMMUNICATION_PREFERENCE_LABELS } from "@/lib/order-preferences";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  if (session?.role === "DEV") redirect("/dashboard/staff");
  const sp = await searchParams;
  const tab: OrdersTab = isOrdersTab(sp.tab) ? sp.tab : "progreso";
  const orders = await getOrders(tab);

  return (
    <main className="px-4 py-10 sm:px-8 sm:py-14">
      <div className="w-full max-w-none">
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">Mis pedidos</h1>

        <div className="mt-6 flex flex-wrap gap-2 border-b border-foreground/10 pb-4" role="tablist" aria-label="Filtro de pedidos">
          {TABS.map((item) => {
            const active = item.id === tab;
            return (
              <Link
                key={item.id}
                href={`/dashboard/orders?tab=${item.id}`}
                aria-selected={active}
                role="tab"
                className={
                  active
                    ? "rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
                    : "rounded-full border px-4 py-1.5 text-sm font-medium text-foreground/75 transition-colors hover:bg-muted"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {orders.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">No hay pedidos en esta categoría.</p>
            <Button render={<Link href="/dashboard/servicios" />} nativeButton={false} size="sm" className="mt-4">
              Ver servicios
            </Button>
          </div>
        ) : (
          <ul className="mt-6 flex flex-col gap-3">
            {orders.map((order) => (
              <li key={order.id}>
                <Card>
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{order.serviceTitle}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {formatDate(order.createdAt)} · {order.message.slice(0, 90)}
                          {order.message.length > 90 ? "…" : ""}
                        </p>
                        {order.communicationPreference && (
                          <p className="mt-1 text-xs text-accent-green">
                            Preferencia: {COMMUNICATION_PREFERENCE_LABELS[order.communicationPreference]}
                          </p>
                        )}
                      </div>
                      <Badge className={STATUS_META[order.status].className}>
                        {STATUS_META[order.status].label}
                      </Badge>
                    </div>
                    <OrderAssignmentStatus
                      assignedDevId={order.assignedDevId}
                      chatHref={`/dashboard/chats/${order.id}`}
                    />
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
