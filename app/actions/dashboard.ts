"use server";

import { revalidatePath } from "next/cache";
import { ensurePocketBaseAdmin, pbFilterValue, toDate } from "@/lib/pocketbase";
import { getSession } from "@/lib/auth/session";
import type { CommunicationPreference, OrderStatus, Role } from "@/lib/data-types";
import { getDirectChatList } from "@/app/actions/team-chats";
import { createClientNotification } from "@/lib/notification-delivery";
import { getCommunicationPreference } from "@/lib/order-preferences";
import { mapOrderPaymentRequest } from "@/lib/order-payments";
import { getApprovedOrderPayments, getOrderPaymentMap, isAdvancePaid } from "@/lib/order-payment-access";
import { getServicePricing } from "@/lib/service-pricing";
import { cancelBankTransfer } from "@/app/actions/order-payments";

type PBRecord = {
  id: string;
  service?: string;
  client?: string;
  order?: string;
  author?: string;
  authorRole?: string;
  message?: string;
  status?: string;
  isCustom?: boolean;
  assignedDev?: string;
  assignmentNote?: string;
  assignedBy?: string;
  repositoryUrl?: string;
  previewUrl?: string;
  screenshots?: string[] | string;
  demoVideo?: string;
  demoDuration?: number;
  chatDeliveredAt?: string;
  emailDeliveredAt?: string;
  deliveryEmail?: string;
  fullName?: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
  role?: string;
  expand?: {
    service?: { title?: string; priceArs?: number; priceUsd?: number; advancePaymentPercent?: number; promotionActive?: boolean; promotionPriceArs?: number };
    author?: { fullName?: string; email?: string };
    client?: { fullName?: string; email?: string };
    assignedDev?: { fullName?: string; email?: string };
    assignedBy?: { fullName?: string; email?: string };
  };
};

export type DashboardOrder = {
  id: string;
  serviceId: string;
  serviceTitle: string;
  message: string;
  communicationPreference: CommunicationPreference | null;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  clientId: string;
  assignedDevId: string;
  assignedDevName: string;
  isCustom: boolean;
  priceArs: number;
  priceUsd: number;
  advancePaymentPercent: number;
  promotionActive: boolean;
  promotionPriceArs: number | null;
  clientEmail: string;
};

export type StaffOrderDetails = Pick<DashboardOrder,
  "id" | "serviceTitle" | "message" | "communicationPreference" | "status" | "createdAt" | "updatedAt"
> & {
  assignmentNote: string;
  assignedByName: string;
  attachmentLinks: { id: string; href: string }[];
  deliverables: {
    repositoryUrl: string;
    previewUrl: string;
    screenshots: { name: string; href: string }[];
    demoVideoHref: string | null;
    demoDuration: number;
  } | null;
};

export type StaffOrderListItem = Pick<DashboardOrder,
  "id" | "serviceTitle" | "message" | "communicationPreference" | "status" | "createdAt"
>;

export type ChatMessage = {
  id: string;
  orderId: string;
  authorName: string;
  authorRole: string;
  message: string;
  attachments?: { name: string; kind: "image" | "audio"; url: string }[];
  createdAt: Date;
  mine: boolean;
};

function mapOrder(record: PBRecord): DashboardOrder {
  return {
    id: record.id,
    serviceId: String(record.service),
    serviceTitle: record.expand?.service?.title ?? (record.isCustom ? "Pedido personalizado" : "Servicio eliminado"),
    message: record.message ?? "",
    communicationPreference: getCommunicationPreference(record.message ?? ""),
    status: record.status as OrderStatus,
    createdAt: toDate(record.createdAt ?? ""),
    updatedAt: toDate(record.updatedAt ?? record.createdAt ?? ""),
    clientId: String(record.client),
    assignedDevId: String(record.assignedDev ?? ""),
    assignedDevName: record.expand?.assignedDev?.fullName || record.expand?.assignedDev?.email || "",
    isCustom: record.isCustom === true,
    priceArs: record.expand?.service?.priceArs ?? 0,
    priceUsd: record.expand?.service?.priceUsd ?? 0,
    advancePaymentPercent: record.expand?.service?.advancePaymentPercent ?? 100,
    promotionActive: record.expand?.service?.promotionActive === true,
    promotionPriceArs: record.expand?.service?.promotionPriceArs ?? null,
    clientEmail: record.expand?.client?.email ?? "",
  };
}

async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");
  return session;
}

async function fetchOrders(session: { userId: string; role: Role }, statusFilter?: string) {
  const pb = await ensurePocketBaseAdmin();
  const parts: string[] = [];
  if (session.role === "DEV") parts.push(`assignedDev = ${pbFilterValue(session.userId)}`);
  else if (session.role !== "OWNER" && session.role !== "ADMIN") parts.push(`client = ${pbFilterValue(session.userId)}`);
  if (statusFilter) parts.push(statusFilter);

  const options: Record<string, unknown> = { expand: "service,assignedDev", sort: "-createdAt" };
  if (parts.length) options.filter = parts.join(" && ");

  const records = await pb.collection("ttmcobuild_orders").getFullList(options);
  return records.map((record) => mapOrder(record as unknown as PBRecord));
}

export type OrdersTab = "progreso" | "hechos" | "cancelados" | "todos";

const TAB_STATUS_FILTERS: Record<OrdersTab, string | undefined> = {
  progreso: '(status = "PENDING" || status = "IN_PROGRESS" || status = "REVIEW" || status = "APPROVED")',
  hechos: 'status = "DONE"',
  cancelados: 'status = "CANCELLED"',
  todos: undefined,
};

export async function getOrders(tab: OrdersTab): Promise<DashboardOrder[]> {
  const session = await requireSession();
  if (session.role === "DEV") throw new Error("Los pedidos asignados están en la sección del equipo.");
  return fetchOrders(session, TAB_STATUS_FILTERS[tab] ?? undefined);
}

export async function getStaffOrders(): Promise<StaffOrderListItem[]> {
  const session = await requireSession();
  if (!["DEV", "ADMIN", "OWNER"].includes(session.role)) throw new Error("No autorizado");
  const orders = await fetchOrders(session);
  const visibleOrders = session.role === "DEV"
    ? await (async () => {
      const pb = await ensurePocketBaseAdmin();
      const paymentsByOrder = await getOrderPaymentMap(pb);
      return orders.filter((order) => order.assignedDevId && isAdvancePaid(order, paymentsByOrder.get(order.id) ?? []));
    })()
    : orders.filter((order) => Boolean(order.assignedDevId));
  return visibleOrders.map(({ id, serviceTitle, message, communicationPreference, status, createdAt }) => ({
    id, serviceTitle, message, communicationPreference, status, createdAt,
  }));
}

export async function getStaffOrderDetails(orderId: string): Promise<StaffOrderDetails> {
  const session = await requireSession();
  if (!["DEV", "ADMIN", "OWNER"].includes(session.role)) throw new Error("No autorizado");
  if (!/^[a-zA-Z0-9]{15}$/.test(orderId)) throw new Error("Pedido inexistente");
  const pb = await ensurePocketBaseAdmin();
  const record = (await pb.collection("ttmcobuild_orders").getOne(orderId, {
    expand: "service,assignedDev",
  })) as unknown as PBRecord;
  const order = mapOrder(record);
  if (!order.assignedDevId || (session.role === "DEV" && order.assignedDevId !== session.userId)) {
    throw new Error("No autorizado");
  }
  if (session.role === "DEV" && !isAdvancePaid(order, await getApprovedOrderPayments(pb, orderId))) {
    throw new Error("El pedido aparecerá cuando se confirme el pago del anticipo.");
  }
  const attachments = await pb.collection("ttmcobuild_order_attachments").getFullList({
    filter: `order = ${pbFilterValue(orderId)}`,
  });
  let deliverables: StaffOrderDetails["deliverables"] = null;
  try {
    const records = await pb.collection("ttmcobuild_order_deliverables").getFullList({
      filter: `order = ${pbFilterValue(orderId)}`,
      perPage: 1,
    });
    const record = records[0] as unknown as PBRecord | undefined;
    if (record) {
      const screenshotNames = Array.isArray(record.screenshots)
        ? record.screenshots
        : record.screenshots
          ? [record.screenshots]
          : [];
      deliverables = {
        repositoryUrl: record.repositoryUrl ?? "",
        previewUrl: record.previewUrl ?? "N/A",
        screenshots: screenshotNames.map((name) => ({
          name,
          href: `/api/orders/${orderId}/deliverables/${encodeURIComponent(name)}`,
        })),
        demoVideoHref: record.demoVideo ? `/api/orders/${orderId}/deliverables/${encodeURIComponent(record.demoVideo)}` : null,
        demoDuration: Number(record.demoDuration ?? 0),
      };
    }
  } catch {
    // Before the deliverables migration is applied, assigned order details stay readable.
  }
  let assignedByName = "Equipo Devta";
  if (record.assignedBy) {
    try {
      const author = await pb.collection("ttmcobuild_profiles").getOne(record.assignedBy) as { fullName?: string; email?: string };
      assignedByName = author.fullName || author.email || assignedByName;
    } catch {
      // La nota sigue visible aunque la cuenta que asignó el pedido ya no exista.
    }
  }
  return {
    id: order.id,
    serviceTitle: order.serviceTitle,
    message: order.message,
    communicationPreference: order.communicationPreference,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    assignmentNote: record.assignmentNote ?? "",
    assignedByName,
    attachmentLinks: attachments.map((attachment) => ({
      id: attachment.id,
      href: `/api/admin/orders/${orderId}/attachments/${attachment.id}`,
    })),
    deliverables,
  };
}

export async function testCompleteAssignedOrder(orderId: string) {
  if (process.env.NODE_ENV === "production") throw new Error("La finalización de prueba solo está disponible fuera de producción.");
  const session = await requireSession();
  if (session.role !== "DEV") throw new Error("Solo un desarrollador puede usar esta acción.");
  if (!/^[a-zA-Z0-9]{15}$/.test(orderId)) throw new Error("Pedido inexistente.");

  const pb = await ensurePocketBaseAdmin();
  const order = await pb.collection("ttmcobuild_orders").getOne(orderId);
  if (String(order.assignedDev ?? "") !== session.userId) throw new Error("Este pedido no está asignado a tu cuenta.");
  const assignedOrder = await pb.collection("ttmcobuild_orders").getOne(orderId, { expand: "service" }) as unknown as PBRecord;
  if (!isAdvancePaid(mapOrder(assignedOrder), await getApprovedOrderPayments(pb, orderId))) throw new Error("El pedido todavía no está habilitado para el desarrollador.");
  if (["REVIEW", "APPROVED", "DONE", "CANCELLED"].includes(String(order.status))) throw new Error("Reabrí el pedido antes de marcarlo para revisión otra vez.");

  await pb.collection("ttmcobuild_orders").update(orderId, {
    status: "REVIEW",
    updatedAt: new Date().toISOString(),
  });
  revalidatePath("/admin/orders");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/chats");
  revalidatePath(`/dashboard/chats/${orderId}`);
  revalidatePath("/dashboard/staff");
  revalidatePath(`/dashboard/staff/${orderId}`);
  return { completed: true };
}

export async function reopenStaffOrder(orderId: string) {
  const session = await requireSession();
  if (!['DEV', 'ADMIN', 'OWNER'].includes(session.role)) throw new Error('No autorizado.');
  if (!/^[a-zA-Z0-9]{15}$/.test(orderId)) throw new Error('Pedido inexistente.');

  const pb = await ensurePocketBaseAdmin();
  const order = await pb.collection('ttmcobuild_orders').getOne(orderId, { cache: 'no-store' });
  if (!order.assignedDev || (session.role === "DEV" && String(order.assignedDev) !== session.userId)) {
    throw new Error('Este pedido no está asignado a tu cuenta.');
  }
  const orderStatus = String(order.status);
  if (!["REVIEW", "APPROVED", "DONE"].includes(orderStatus) || (["APPROVED", "DONE"].includes(orderStatus) && session.role === "DEV")) {
    throw new Error("Solo admin u owner pueden reabrir un pedido aprobado.");
  }

  if (orderStatus === "APPROVED" || orderStatus === "DONE") {
    const pendingBalances = await pb.collection("ttmcobuild_order_payments").getFullList({
      filter: `order = ${pbFilterValue(orderId)} && method = "BANK_TRANSFER" && purpose = "BALANCE" && status = "PENDING"`,
      fields: "id",
    });
    for (const payment of pendingBalances) await cancelBankTransfer(String(payment.id));
  }

  await pb.collection('ttmcobuild_orders').update(orderId, {
    status: 'IN_PROGRESS',
    updatedAt: new Date().toISOString(),
  });

  const records = await pb.collection('ttmcobuild_order_deliverables').getFullList({
    filter: `order = ${pbFilterValue(orderId)}`,
    perPage: 1,
  });
  const deliverables = records[0] as { id: string } | undefined;
  if (deliverables) {
    await pb.collection('ttmcobuild_order_deliverables').update(deliverables.id, {
      chatDeliveredAt: '',
      emailDeliveredAt: '',
      deliveryEmail: '',
      deliveryToken: '',
      deliveryTokenExpiresAt: '',
    });
  }

  revalidatePath('/admin/orders');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/orders');
  revalidatePath('/dashboard/chats');
  revalidatePath(`/dashboard/chats/${orderId}`);
  revalidatePath('/dashboard/staff');
  revalidatePath(`/dashboard/staff/${orderId}`);
  return { reopened: true };
}

export async function getDashboardSummary() {
  const session = await requireSession();
  if (session.role === "DEV") throw new Error("Los pedidos asignados están en la sección del equipo.");
  const orders = await fetchOrders(session);
  return {
    inProgress: orders.filter((o) => o.status === "PENDING" || o.status === "IN_PROGRESS" || o.status === "REVIEW" || o.status === "APPROVED").length,
    done: orders.filter((o) => o.status === "DONE").length,
    total: orders.length,
    recent: orders.slice(0, 5),
  };
}

async function getOrderOrFail(session: { userId: string; role: Role }, orderId: string) {
  if (!/^[a-zA-Z0-9]{15}$/.test(orderId)) throw new Error("Pedido inexistente");
  const pb = await ensurePocketBaseAdmin();
  let record: PBRecord;
  try {
    record = (await pb.collection("ttmcobuild_orders").getOne(orderId, { expand: "service,assignedDev,client" })) as unknown as PBRecord;
  } catch (error) {
    if (error && typeof error === "object" && "status" in error && error.status === 404) throw new Error("Pedido inexistente");
    throw error;
  }
  const order = mapOrder(record);
  const canAccess = (session.role === "CLIENTE" && order.clientId === session.userId)
    || session.role === "OWNER"
    || session.role === "ADMIN";
  if (!canAccess) throw new Error("No autorizado");
  return order;
}

async function listMessages(session: { userId: string; role: Role }, orderId: string): Promise<ChatMessage[]> {
  const pb = await ensurePocketBaseAdmin();
  const records = await pb.collection("ttmcobuild_chat_messages").getFullList({
    filter: `order = ${pbFilterValue(orderId)}`,
    expand: "author",
    sort: "createdAt",
  });
  return records.map((raw) => {
    const record = raw as unknown as PBRecord;
    return {
      id: record.id,
      orderId: String(record.order),
      authorName: record.expand?.author?.fullName || record.expand?.author?.email || "Equipo",
      authorRole: String(record.authorRole ?? ""),
      message: record.message ?? "",
      attachments: ((record as unknown as { attachments?: string[] }).attachments ?? []).map((name) => ({
        name,
        kind: /\.(jpe?g|png|webp|gif|avif)$/i.test(name) ? "image" as const : "audio" as const,
        url: `/api/chat/media/${record.id}/${encodeURIComponent(name)}`,
      })),
      createdAt: toDate(record.createdAt ?? ""),
      mine: String(record.author) === session.userId,
    };
  });
}

export async function getChatThread(orderId: string) {
  const session = await requireSession();
  const pb = await ensurePocketBaseAdmin();
  const profile = await pb.collection("ttmcobuild_profiles").getOne(session.userId, {
    fields: "id,role",
    cache: "no-store",
  }) as { role?: string };
  if (profile.role !== "CLIENTE" && profile.role !== "DEV" && profile.role !== "ADMIN" && profile.role !== "OWNER") {
    throw new Error("No autorizado");
  }
  if (profile.role === "DEV") throw new Error("Los chats y pagos con clientes los gestiona el equipo.");
  const currentSession = { userId: session.userId, role: profile.role as Role };
  const order = await getOrderOrFail(currentSession, orderId);
  let paymentResult: { requests: ReturnType<typeof mapOrderPaymentRequest>[]; error: string | null };
  try {
    const records = await pb.collection("ttmcobuild_order_payments").getFullList({
      filter: `order = ${pbFilterValue(order.id)} && method = "BANK_TRANSFER"`,
      sort: "-createdAt",
    });
    paymentResult = { requests: records.map(mapOrderPaymentRequest).filter((request) => request.method === "BANK_TRANSFER"), error: null };
  } catch (error) {
    if (error && typeof error === "object" && "status" in error && error.status === 404) {
      paymentResult = { requests: [], error: null };
    } else {
      paymentResult = { requests: [], error: "No se pudieron cargar las solicitudes de pago." };
    }
  }
  const messages = await listMessages(currentSession, order.id);
  let reviewPanel: { previewUrl: string | null; approved: boolean; closed: boolean } | null = null;
  if (currentSession.role === "CLIENTE" && ["REVIEW", "APPROVED", "DONE"].includes(order.status)) {
    try {
      const records = await pb.collection("ttmcobuild_order_deliverables").getFullList({
        filter: `order = ${pbFilterValue(order.id)}`,
        fields: "previewUrl",
        perPage: 1,
      });
      const previewUrl = String((records[0] as { previewUrl?: string } | undefined)?.previewUrl ?? "");
      reviewPanel = {
        previewUrl: previewUrl && previewUrl !== "N/A" ? previewUrl : null,
        approved: order.status === "APPROVED" || order.status === "DONE",
        closed: order.status === "DONE",
      };
    } catch {
      reviewPanel = { previewUrl: null, approved: order.status === "APPROVED" || order.status === "DONE", closed: order.status === "DONE" };
    }
  }
  let closePanel = false;
  let deliveryPanel: {
    clientEmail: string;
    repositoryUrl: string;
    screenshots: { name: string; href: string }[];
    demoVideoHref: string | null;
    fullyPaid: boolean;
    chatDeliveredAt: string | null;
    emailDeliveredAt: string | null;
    deliveryEmail: string | null;
  } | null = null;
  if (currentSession.role === "ADMIN" || currentSession.role === "OWNER") {
    try {
      const records = await pb.collection("ttmcobuild_order_deliverables").getFullList({
        filter: `order = ${pbFilterValue(order.id)}`,
        perPage: 1,
      });
      const record = records[0] as unknown as PBRecord | undefined;
      const advance = paymentResult.requests.find((request) => request.purpose === "ADVANCE" && request.status === "APPROVED");
      if (record && advance && record.repositoryUrl && (order.status === "APPROVED" || order.status === "DONE")) {
        const screenshotNames = Array.isArray(record.screenshots) ? record.screenshots : record.screenshots ? [record.screenshots] : [];
        const total = advance.totalAmount ?? (order.isCustom ? advance.amount : advance.currency === "ARS"
          ? getServicePricing(order).currentArs
          : getServicePricing(order).currentUsd);
        const paid = paymentResult.requests
          .filter((request) => request.status === "APPROVED" && request.currency === advance.currency)
          .reduce((sum, request) => sum + request.amount, 0);
        if (paid + 0.005 >= total) {
          deliveryPanel = {
            clientEmail: order.clientEmail,
            repositoryUrl: record.repositoryUrl,
            screenshots: screenshotNames.map((name) => ({
              name,
              href: `/api/orders/${order.id}/deliverables/${encodeURIComponent(name)}`,
            })),
            demoVideoHref: record.demoVideo ? `/api/orders/${order.id}/deliverables/${encodeURIComponent(record.demoVideo)}` : null,
            fullyPaid: true,
            chatDeliveredAt: record.chatDeliveredAt ?? null,
            emailDeliveredAt: record.emailDeliveredAt ?? null,
            deliveryEmail: record.deliveryEmail ?? null,
          };
          closePanel = (currentSession.role === "ADMIN" || currentSession.role === "OWNER")
            && order.status === "APPROVED"
            && Boolean(record.chatDeliveredAt || record.emailDeliveredAt);
        }
      }
    } catch {
      deliveryPanel = null;
    }
  }
  return { order, messages, paymentRequests: paymentResult.requests, paymentRequestsError: paymentResult.error, sessionRole: currentSession.role, reviewPanel, closePanel, deliveryPanel };
}

export async function sendChatMessage(orderId: string, message: string) {
  const session = await requireSession();
  if (!["CLIENTE", "ADMIN", "OWNER"].includes(session.role)) throw new Error("No autorizado");
  const text = message.trim();
  if (!text) throw new Error("El mensaje está vacío.");
  if (text.length > 5000) throw new Error("El mensaje es demasiado largo.");

  const { order, sessionRole } = await getChatThread(orderId);
  if (!["CLIENTE", "ADMIN", "OWNER"].includes(sessionRole)) throw new Error("No autorizado");
  const pb = await ensurePocketBaseAdmin();
  const now = new Date().toISOString();
  let authorName = "Vos";
  try {
    const author = (await pb.collection("ttmcobuild_profiles").getOne(session.userId)) as unknown as PBRecord;
    authorName = author.fullName || author.email || "Vos";
  } catch {
    // Name is only used for the optimistic echo.
  }

  const record = (await pb.collection("ttmcobuild_chat_messages").create({
    order: order.id,
    author: session.userId,
    authorRole: sessionRole,
    message: text,
    createdAt: now,
    updatedAt: now,
  })) as unknown as PBRecord;

  if (["ADMIN", "OWNER"].includes(sessionRole)) {
    try {
      const orderRecord = (await pb.collection("ttmcobuild_orders").getOne(order.id, {
        expand: "client,service",
      })) as unknown as PBRecord;
      const serviceTitle = orderRecord.expand?.service?.title ?? "tu proyecto";
      await createClientNotification({
        recipientId: String(orderRecord.client),
        orderId: order.id,
        type: "MESSAGE",
        message: `Tenés un mensaje nuevo de ${authorName} sobre ${serviceTitle}.`,
        href: `/dashboard/chats/${order.id}`,
        email: orderRecord.expand?.client?.email ?? "",
      });
    } catch (error) {
      console.error("No se pudo crear la notificación del mensaje del equipo.", error);
    }
  }

  revalidatePath("/dashboard/chats");
  revalidatePath("/dashboard", "layout");
  return {
    id: record.id,
    orderId: String(record.order),
    authorName,
    authorRole: sessionRole,
    message: text,
    createdAt: toDate(record.createdAt ?? ""),
    mine: true,
  } satisfies ChatMessage;
}

export type ChatListItem = {
  kind: "order" | "user";
  orderId?: string;
  contactId?: string;
  contactName?: string;
  serviceTitle: string;
  orderStatus: OrderStatus;
  orderCreatedAt: Date;
  messageCount: number;
  lastMessage: { text: string; authorName: string; createdAt: Date } | null;
};

export async function getChatList(): Promise<ChatListItem[]> {
  const session = await requireSession();
  if (session.role === "DEV") return [];
  const orders = await fetchOrders(session);

  const pb = await ensurePocketBaseAdmin();
  const messages = await pb.collection("ttmcobuild_chat_messages").getFullList({
    expand: "author",
    sort: "createdAt",
  });

  const byOrder = new Map<string, PBRecord[]>();
  for (const raw of messages) {
    const record = raw as unknown as PBRecord;
    const key = String(record.order);
    const list = byOrder.get(key) ?? [];
    list.push(record);
    byOrder.set(key, list);
  }

  const orderChats = orders.map((order) => {
      const list = byOrder.get(order.id) ?? [];
      const last = list[list.length - 1];
      return {
        kind: "order" as const,
        orderId: order.id,
        serviceTitle: order.serviceTitle,
        orderStatus: order.status,
        orderCreatedAt: order.createdAt,
        messageCount: list.length,
        lastMessage: last
          ? {
              text: last.message ?? "",
              authorName: last.expand?.author?.fullName || last.expand?.author?.email || "Equipo",
              createdAt: toDate(last.createdAt ?? ""),
            }
          : null,
      };
    });
  const directChats = await getDirectChatList();
  return [
    ...orderChats,
    ...directChats.map((chat) => ({
      kind: "user" as const,
      contactId: chat.contactId,
      contactName: chat.contactName,
      serviceTitle: `Chat con ${chat.contactName}`,
      orderStatus: "IN_PROGRESS" as OrderStatus,
      orderCreatedAt: chat.updatedAt,
      messageCount: chat.messageCount,
      lastMessage: { text: chat.lastMessage, authorName: chat.lastAuthorName, createdAt: chat.updatedAt },
    })),
  ].sort((a, b) => (b.lastMessage?.createdAt ?? b.orderCreatedAt).getTime() - (a.lastMessage?.createdAt ?? a.orderCreatedAt).getTime());
}
