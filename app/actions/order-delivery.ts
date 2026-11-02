"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import type { Role } from "@/lib/data-types";
import { ensurePocketBaseAdmin, pbFilterValue } from "@/lib/pocketbase";
import { getApprovedOrderPayments, isAdvancePaid } from "@/lib/order-payment-access";
import { getServicePricing } from "@/lib/service-pricing";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

async function getDeliverableContext(orderId: string) {
  if (!/^[a-zA-Z0-9]{15}$/.test(orderId)) throw new Error("Pedido inexistente.");
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "OWNER")) throw new Error("Solo admin u owner puede entregar los materiales.");
  const pb = await ensurePocketBaseAdmin();
  const order = await pb.collection("ttmcobuild_orders").getOne(orderId, { expand: "service,client", cache: "no-store" }) as {
    id: string; status: string; isCustom?: boolean; client: string;
    expand?: { service?: { priceArs?: number; priceUsd?: number; advancePaymentPercent?: number; promotionActive?: boolean; promotionPriceArs?: number }; client?: { email?: string } };
  };
  if (order.status !== "APPROVED" && order.status !== "DONE") throw new Error("El cliente debe aprobar la página antes de entregar los materiales.");
  const payments = await getApprovedOrderPayments(pb, orderId);
  if (!isAdvancePaid(order as Parameters<typeof isAdvancePaid>[0], payments)) throw new Error("El anticipo todavía no está confirmado.");
  const advance = payments.find((payment) => payment.status === "APPROVED" && payment.purpose === "ADVANCE");
  if (!advance) throw new Error("No hay un anticipo confirmado para este pedido.");
  let total = advance.totalAmount;
  if (!total) {
    if (order.isCustom) total = advance.amount;
    else {
      const service = order.expand?.service;
      if (!service) throw new Error("No se pudo determinar el total del servicio.");
      if (typeof service.priceArs !== "number" || typeof service.priceUsd !== "number") throw new Error("No se pudo determinar el total del servicio.");
      const pricing = getServicePricing({
        priceArs: service.priceArs,
        priceUsd: service.priceUsd,
        promotionActive: Boolean(service.promotionActive),
        promotionPriceArs: service.promotionPriceArs ?? null,
      });
      total = advance.currency === "ARS" ? pricing.currentArs : pricing.currentUsd;
    }
  }
  const paid = payments.filter((payment) => payment.status === "APPROVED" && payment.currency === advance.currency)
    .reduce((sum, payment) => sum + payment.amount, 0);
  if (paid + 0.005 < total) throw new Error("La transferencia del saldo debe confirmarse antes de entregar los materiales.");

  const records = await pb.collection("ttmcobuild_order_deliverables").getFullList({
    filter: `order = ${pbFilterValue(orderId)}`,
    perPage: 1,
  });
  const deliverables = records[0] as {
    id: string; repositoryUrl?: string; screenshots?: string[]; demoVideo?: string;
    chatDeliveredAt?: string; emailDeliveredAt?: string; deliveryToken?: string; deliveryTokenExpiresAt?: string;
  } | undefined;
  if (!deliverables?.repositoryUrl || !deliverables.screenshots?.length) {
    throw new Error("Faltan el repositorio o las capturas de la entrega.");
  }
  return { pb, session, order, deliverables };
}

function revalidateDelivery(orderId: string) {
  revalidatePath(`/dashboard/chats/${orderId}`);
  revalidatePath(`/admin/chats/orders/${orderId}`);
  revalidatePath(`/dashboard/staff/${orderId}`);
}

export async function sendOrderDeliveryToChat(orderId: string) {
  const { pb, session, deliverables } = await getDeliverableContext(orderId);
  if (deliverables.chatDeliveredAt) throw new Error("Los materiales ya se enviaron por el chat.");
  const assets = [
    `Repositorio de GitHub: ${deliverables.repositoryUrl}`,
    ...deliverables.screenshots!.map((name, index) => `Captura ${index + 1}: /api/orders/${orderId}/deliverables/${encodeURIComponent(name)}`),
    ...(deliverables.demoVideo ? [`Video demo: /api/orders/${orderId}/deliverables/${encodeURIComponent(deliverables.demoVideo)}`] : []),
  ];
  const message = `Entrega final de materiales\n\n${assets.join("\n")}`;
  const now = new Date().toISOString();
  await pb.collection("ttmcobuild_chat_messages").create({
    order: orderId,
    author: session.userId,
    authorRole: session.role as Role,
    message,
    createdAt: now,
    updatedAt: now,
  });
  await pb.collection("ttmcobuild_order_deliverables").update(deliverables.id, { chatDeliveredAt: now });
  revalidateDelivery(orderId);
  return { sent: true };
}

export async function sendOrderDeliveryByEmail(orderId: string, alternateEmail?: string) {
  const { pb, order, deliverables } = await getDeliverableContext(orderId);
  if (deliverables.emailDeliveredAt) throw new Error("Los materiales ya se enviaron por email.");
  const recipient = alternateEmail?.trim() || order.expand?.client?.email?.trim() || "";
  if (!emailPattern.test(recipient)) throw new Error("Ingresá un correo válido para enviar los materiales.");
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Falta configurar Resend para enviar el email.");
  const baseUrl = (process.env.APP_URL || "https://ttmagencia.com").replace(/\/$/, "");
  let parsedBaseUrl: URL;
  try {
    parsedBaseUrl = new URL(baseUrl);
  } catch {
    throw new Error("APP_URL no es una dirección válida.");
  }
  if (parsedBaseUrl.protocol !== "https:" && parsedBaseUrl.hostname !== "localhost") throw new Error("APP_URL debe usar HTTPS.");

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await pb.collection("ttmcobuild_order_deliverables").update(deliverables.id, {
    deliveryToken: token,
    deliveryTokenExpiresAt: expiresAt,
  });
  const screenshotLinks = deliverables.screenshots!.map((name, index) => ({
    label: `Captura ${index + 1}`,
    url: `${baseUrl}/api/orders/${orderId}/deliverables/${encodeURIComponent(name)}?token=${token}`,
  }));
  const links = [
    `<li><a href="${safeHtml(deliverables.repositoryUrl!)}">Repositorio de GitHub</a></li>`,
    ...screenshotLinks.map((item) => `<li><a href="${safeHtml(item.url)}">${item.label}</a></li>`),
    ...(deliverables.demoVideo ? [`<li><a href="${safeHtml(`${baseUrl}/api/orders/${orderId}/deliverables/${encodeURIComponent(deliverables.demoVideo)}?token=${token}`)}">Video demo</a></li>`] : []),
  ].join("");
  const textLinks = [
    `Repositorio de GitHub: ${deliverables.repositoryUrl}`,
    ...screenshotLinks.map((item) => `${item.label}: ${item.url}`),
    ...(deliverables.demoVideo ? [`Video demo: ${baseUrl}/api/orders/${orderId}/deliverables/${encodeURIComponent(deliverables.demoVideo)}?token=${token}`] : []),
  ].join("\n");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || "Devta <staff@ttmagencia.com>",
      to: [recipient],
      subject: "Materiales finales de tu proyecto",
      html: `<p>Ya está lista la entrega de tu proyecto.</p><ul>${links}</ul><p>Los archivos estarán disponibles durante 30 días.</p>`,
      text: `Ya está lista la entrega de tu proyecto.\n\n${textLinks}\n\nLos archivos estarán disponibles durante 30 días.`,
    }),
  });
  if (!response.ok) {
    await pb.collection("ttmcobuild_order_deliverables").update(deliverables.id, { deliveryToken: "", deliveryTokenExpiresAt: "" }).catch(() => undefined);
    throw new Error("Resend no pudo enviar el email de entrega.");
  }
  const now = new Date().toISOString();
  await pb.collection("ttmcobuild_order_deliverables").update(deliverables.id, { emailDeliveredAt: now, deliveryEmail: recipient });
  revalidateDelivery(orderId);
  return { sent: true };
}
