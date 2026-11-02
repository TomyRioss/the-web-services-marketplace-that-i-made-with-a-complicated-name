import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { getChatList } from "@/app/actions/dashboard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { STATUS_META, formatDateTime } from "../ui-helpers";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function ChatsPage() {
  const session = await getSession();
  if (session?.role === "DEV") redirect("/dashboard/staff");
  const chats = await getChatList();

  return (
    <main className="px-4 py-10 sm:px-8 sm:py-14">
      <div className="w-full max-w-none">
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">Chats</h1>
        <p className="mt-2 text-muted-foreground">
          Acá aparecen tus chats directos y los pedidos que ya tienen un desarrollador asignado.
        </p>

        {chats.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Todavía no tenés chats. Cada pedido tiene una conversación directa con el equipo.
            </p>
            <Button render={<Link href="/dashboard/servicios" />} nativeButton={false} size="sm" className="mt-4">
              Ver servicios
            </Button>
          </div>
        ) : (
          <ul className="mt-8 flex flex-col gap-3">
            {chats.map((chat) => (
              <li key={chat.kind === "order" ? chat.orderId : chat.contactId}>
                <Link href={chat.kind === "order" ? `/dashboard/chats/${chat.orderId}` : `/dashboard/chats/users/${chat.contactId}`} className="block group">
                  <Card className="transition-colors hover:border-primary/40">
                    <CardContent className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{chat.serviceTitle}</p>
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {chat.lastMessage
                            ? `${chat.lastMessage.authorName}: ${chat.lastMessage.text} · ${formatDateTime(chat.lastMessage.createdAt)}`
                            : `Pedido del ${formatDateTime(chat.orderCreatedAt)} · sin mensajes todavía`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {chat.messageCount > 0 && (
                          <span className="text-xs text-muted-foreground">{chat.messageCount} msj{chat.messageCount === 1 ? "" : "es"}</span>
                        )}
                        {chat.kind === "order" && (
                          <Badge className={STATUS_META[chat.orderStatus].className}>
                            {STATUS_META[chat.orderStatus].label}
                          </Badge>
                        )}
                        <MessageSquare className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
