import Link from "next/link";
import { MessageSquare, Users } from "lucide-react";
import { getTeamChatContacts, getTeamChatOrders } from "@/app/actions/team-chats";
import { getSession } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { STATUS_META, formatDateTime } from "../../dashboard/ui-helpers";
import { redirect } from "next/navigation";

export default async function TeamChatsPage() {
  const session = await getSession();
  if (session?.role === "DEV") redirect("/dashboard/staff");
  const [orders, contacts] = await Promise.all([
    getTeamChatOrders(),
    session?.role === "OWNER" || session?.role === "ADMIN" ? getTeamChatContacts() : Promise.resolve([]),
  ]);

  return (
    <main className="px-4 py-8 sm:px-8 sm:py-12">
      <div className="w-full max-w-none">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Chats del equipo</h1>
        <p className="mt-2 text-muted-foreground">Mensajes y comprobantes de clientes, gestionados por el equipo.</p>

        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Chats por pedido</h2>
          {orders.length === 0 ? (
            <div className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
              Todavía no hay pedidos asignados con chat.
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {orders.map((order) => (
                <li key={order.id}>
                  <Link href={`/admin/chats/orders/${order.id}`} className="group block">
                    <Card className="transition-colors group-hover:border-primary/40">
                      <CardContent className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{order.serviceTitle} <span className="font-normal text-muted-foreground">· {order.clientName}</span></p>
                          <p className="mt-1 truncate text-sm text-muted-foreground">
                            {order.lastMessage
                              ? `${order.lastMessage.authorName}: ${order.lastMessage.text} · ${formatDateTime(order.lastMessage.createdAt)}`
                              : `${order.clientEmail} · pedido del ${formatDateTime(order.createdAt)} · sin mensajes`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={STATUS_META[order.status].className}>{STATUS_META[order.status].label}</Badge>
                          <span className="text-xs text-muted-foreground">{order.messageCount} mensajes</span>
                          <MessageSquare className="size-4 text-muted-foreground group-hover:text-primary" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {(session?.role === "OWNER" || session?.role === "ADMIN") && (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-semibold">Iniciar chat con un usuario</h2>
            {contacts.length === 0 ? (
              <div className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">No hay otros usuarios registrados.</div>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {contacts.map((contact) => (
                  <li key={contact.id}>
                    <Link href={`/admin/chats/users/${contact.id}`} className="group block">
                      <Card className="h-full transition-colors group-hover:border-primary/40">
                        <CardContent className="flex items-center gap-3">
                          <Users className="size-4 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{contact.name}</span>
                            <span className="block truncate text-sm text-muted-foreground">{contact.email}</span>
                          </span>
                          <Badge variant="outline">{contact.role}</Badge>
                        </CardContent>
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
