import { getAllOrders, getAssignableDevelopers } from "@/app/actions/marketplace";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FaWhatsapp } from "react-icons/fa";
import { OrderStatusSelect } from "./OrderStatusSelect";
import { OrderAssigneeSelect } from "./OrderAssigneeSelect";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { COMMUNICATION_PREFERENCE_LABELS } from "@/lib/order-preferences";

function splitMessageReferences(message: string) {
  const cleanMessage = message.replace(/\n\nPreferencia de comunicación: (?:Quiero que me hablen|Trabajo autónomo)(?=\n|$)/, "");
  const marker = "\n\nEnlaces de referencia:\n";
  const index = cleanMessage.indexOf(marker);
  if (index < 0) return { description: cleanMessage, links: [] as string[] };
  const links = cleanMessage.slice(index + marker.length).split("\n").filter((link) => {
    try {
      const url = new URL(link);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  });
  return {
    description: cleanMessage.slice(0, index),
    links,
  };
}

export default async function AdminOrdersPage() {
  const session = await getSession();
  if (session?.role === "DEV") redirect("/admin/chats");
  const [orders, developers] = await Promise.all([getAllOrders(), getAssignableDevelopers()]);

  return (
    <main className="flex-1 overflow-y-auto px-4 py-10 sm:px-8 sm:py-14">
      <div className="w-full max-w-none">
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          Pedidos
        </h1>

        {developers.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            Todavía no hay usuarios disponibles para asignar pedidos.
          </p>
        )}

        <Card className="mt-6">
          <CardContent>
            {orders.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">Todavía no hay pedidos.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Mensaje</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Desarrollador</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      {(() => {
                        const { description, links } = splitMessageReferences(order.message);
                        return (
                          <>
                      <TableCell className="font-medium">{order.service.title}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span>{order.client.email}</span>
                          {order.client.phone && (
                            <a
                              href={`https://wa.me/${order.client.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                            >
                              <FaWhatsapp className="size-3.5" />
                              {order.client.phone}
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-sm whitespace-normal">
                        <p className="line-clamp-3">{description}</p>
                        {order.communicationPreference && (
                          <p className="mt-1 text-xs text-accent-green">
                            Preferencia: {COMMUNICATION_PREFERENCE_LABELS[order.communicationPreference]}
                          </p>
                        )}
                        {links.length > 0 && (
                          <div className="mt-2 flex flex-col gap-1">
                            {links.map((link, index) => (
                              <a key={`${order.id}-reference-${index}`} href={link} target="_blank" rel="noopener noreferrer" className="max-w-64 truncate text-xs text-accent-green underline underline-offset-2">
                                Referencia {index + 1}: {link}
                              </a>
                            ))}
                          </div>
                        )}
                        {order.attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {order.attachments.map((attachment: { id: string }, index: number) => (
                              <a key={attachment.id} href={`/api/admin/orders/${order.id}/attachments/${attachment.id}`} target="_blank" rel="noreferrer" className="rounded-full border border-accent-green/30 px-2.5 py-1 text-xs text-accent-green hover:bg-accent-green/10">
                                Imagen {index + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{order.createdAt.toLocaleDateString("es-AR")}</TableCell>
                      <TableCell>
                        <OrderStatusSelect orderId={order.id} status={order.status} />
                      </TableCell>
                      <TableCell>
                        <OrderAssigneeSelect
                          orderId={order.id}
                          assignedDevId={order.assignedDevId}
                          initialAssignmentNote={order.assignmentNote}
                          developers={developers}
                        />
                      </TableCell>
                          </>
                        );
                      })()}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
