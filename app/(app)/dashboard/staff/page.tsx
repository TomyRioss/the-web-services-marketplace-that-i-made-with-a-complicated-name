import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ClipboardList } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getStaffOrders } from "@/app/actions/dashboard";
import { Badge } from "@/components/ui/badge";
import { STATUS_META, formatDate } from "../ui-helpers";

export default async function StaffPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!["DEV", "ADMIN", "OWNER"].includes(session.role)) redirect("/dashboard");

  const orders = await getStaffOrders();

  return (
    <main className="min-h-full w-full px-4 py-8 sm:px-8 sm:py-10">
      <div className="w-full">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-foreground/10 pb-5">
          <div>
            <h1 className="font-heading text-2xl tracking-tight sm:text-3xl">{session.role === "DEV" ? "Pedidos asignados" : "Pedidos del equipo"}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {session.role === "DEV" ? "Pedidos asignados a tu cuenta." : "Pedidos asignados y notas para el equipo."}
            </p>
          </div>
          <span className="text-sm tabular-nums text-muted-foreground">{orders.length} {orders.length === 1 ? "pedido" : "pedidos"}</span>
        </header>

        {orders.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-foreground/20 px-6 py-14 text-center">
            <ClipboardList aria-hidden="true" className="mx-auto size-8 text-accent-green" />
            <h2 className="mt-4 text-lg font-semibold">Todavía no hay pedidos asignados</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Cuando el equipo te asigne un pedido, vas a encontrar acá la solicitud y las notas de trabajo.
            </p>
          </section>
        ) : (
          <ul className="divide-y divide-foreground/10">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/dashboard/staff/${order.id}`}
                  className="group flex flex-col gap-3 py-5 outline-none transition-colors focus-visible:bg-muted/30 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="truncate text-base font-semibold group-hover:text-accent-green">{order.serviceTitle}</h2>
                      <Badge className={STATUS_META[order.status].className}>{STATUS_META[order.status].label}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">Recibido el {formatDate(order.createdAt)}</p>
                    {order.message && <p className="mt-2 line-clamp-2 max-w-3xl whitespace-pre-line text-sm text-foreground/75">{order.message}</p>}
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-accent-green">
                    Ver pedido <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
