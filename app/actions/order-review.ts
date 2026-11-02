"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { ensurePocketBaseAdmin } from "@/lib/pocketbase";
import { mapOrderPaymentRequest } from "@/lib/order-payments";
import { getServicePricing } from "@/lib/service-pricing";

export async function approveOrderReview(orderId: string) {
  const session = await getSession();
  if (!session || session.role !== "CLIENTE") throw new Error("Solo el cliente puede aprobar la página.");
  if (!/^[a-zA-Z0-9]{15}$/.test(orderId)) throw new Error("Pedido inexistente.");

  const pb = await ensurePocketBaseAdmin();
  const order = await pb.collection("ttmcobuild_orders").getOne(orderId, { cache: "no-store" });
  if (String(order.client ?? "") !== session.userId) throw new Error("Este pedido no pertenece a tu cuenta.");
  if (String(order.status) !== "REVIEW") throw new Error("El pedido ya no está esperando tu aprobación.");

  await pb.collection("ttmcobuild_orders").update(orderId, {
    status: "APPROVED",
    updatedAt: new Date().toISOString(),
  });

  for (const path of ["/dashboard", "/dashboard/orders", "/dashboard/chats", `/dashboard/chats/${orderId}`, "/dashboard/staff", `/dashboard/staff/${orderId}`, "/admin/orders", `/admin/chats/orders/${orderId}`]) {
    revalidatePath(path);
  }
  return { approved: true };
}

export async function closeApprovedOrder(orderId: string) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "OWNER")) throw new Error("Solo admin u owner puede cerrar el pedido.");
  if (!/^[a-zA-Z0-9]{15}$/.test(orderId)) throw new Error("Pedido inexistente.");

  const pb = await ensurePocketBaseAdmin();
  const order = await pb.collection("ttmcobuild_orders").getOne(orderId, { expand: "service", cache: "no-store" });
  if (String(order.status) !== "APPROVED") throw new Error("El pedido todavía no está aprobado por el cliente.");

  const paymentRecords = await pb.collection("ttmcobuild_order_payments").getFullList({
    filter: `order = "${orderId}" && method = "BANK_TRANSFER"`,
  });
  const payments = paymentRecords.map(mapOrderPaymentRequest);
  const advance = payments.find((payment) => payment.purpose === "ADVANCE" && payment.status === "APPROVED");
  if (!advance) throw new Error("Todavía no está confirmado el anticipo.");
  const service = order.expand?.service;
  const total = advance.totalAmount ?? (order.isCustom
    ? advance.amount
    : advance.currency === "ARS"
      ? getServicePricing(service).currentArs
      : getServicePricing(service).currentUsd);
  const paid = payments.filter((payment) => payment.status === "APPROVED" && payment.currency === advance.currency)
    .reduce((sum, payment) => sum + payment.amount, 0);
  if (paid + 0.005 < total) throw new Error("Confirmá el pago restante antes de cerrar el pedido.");

  const deliverableRecords = await pb.collection("ttmcobuild_order_deliverables").getFullList({
    filter: `order = "${orderId}"`,
    fields: "id,chatDeliveredAt,emailDeliveredAt",
    perPage: 1,
  });
  const delivered = deliverableRecords[0] as { chatDeliveredAt?: string; emailDeliveredAt?: string } | undefined;
  if (!delivered?.chatDeliveredAt && !delivered?.emailDeliveredAt) {
    throw new Error("Enviá los materiales finales por chat o email antes de cerrar el pedido.");
  }

  await pb.collection("ttmcobuild_orders").update(orderId, {
    status: "DONE",
    updatedAt: new Date().toISOString(),
  });

  for (const path of ["/dashboard", "/dashboard/orders", "/dashboard/chats", `/dashboard/chats/${orderId}`, "/dashboard/staff", `/dashboard/staff/${orderId}`, "/admin/orders", `/admin/chats/orders/${orderId}`]) {
    revalidatePath(path);
  }
  return { closed: true };
}
