import { getAllOrders } from "@/app/actions/marketplace";
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

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();

  return (
    <main className="flex-1 overflow-y-auto px-4 py-10 pb-24 sm:px-8 sm:py-14 md:pb-14">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          Pedidos
        </h1>

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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
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
                      <TableCell className="max-w-xs truncate whitespace-normal">
                        {order.message}
                      </TableCell>
                      <TableCell>{order.createdAt.toLocaleDateString("es-AR")}</TableCell>
                      <TableCell>
                        <OrderStatusSelect orderId={order.id} status={order.status} />
                      </TableCell>
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
