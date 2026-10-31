"use server";

import { revalidatePath } from "next/cache";
import { ensurePocketBaseAdmin, pbFilterValue, toDate } from "@/lib/pocketbase";
import { getSession } from "@/lib/auth/session";
import type { OrderStatus, Role } from "@/lib/data-types";

const TEAM_ROLES: string[] = ["OWNER", "ADMIN", "DEV"];

type PBRecord = {
  id: string;
  service?: string;
  client?: string;
  order?: string;
  author?: string;
  authorRole?: string;
  message?: string;
  status?: string;
  fullName?: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
  expand?: {
    service?: { title?: string };
    author?: { fullName?: string; email?: string };
  };
};

export type DashboardOrder = {
  id: string;
  serviceId: string;
  serviceTitle: string;
  message: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  clientId: string;
};

export type ChatMessage = {
  id: string;
  orderId: string;
  authorName: string;
  authorRole: string;
  message: string;
  createdAt: Date;
  mine: boolean;
};

function mapOrder(record: PBRecord): DashboardOrder {
  return {
    id: record.id,
    serviceId: String(record.service),
    serviceTitle: record.expand?.service?.title ?? "Servicio eliminado",
    message: record.message ?? "",
    status: record.status as OrderStatus,
    createdAt: toDate(record.createdAt ?? ""),
    updatedAt: toDate(record.updatedAt ?? record.createdAt ?? ""),
    clientId: String(record.client),
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
  if (!TEAM_ROLES.includes(session.role)) parts.push(`client = ${pbFilterValue(session.userId)}`);
  if (statusFilter) parts.push(statusFilter);

  const options: Record<string, unknown> = { expand: "service", sort: "-createdAt" };
  if (parts.length) options.filter = parts.join(" && ");

  const records = await pb.collection("ttmcobuild_orders").getFullList(options);
  return records.map((record) => mapOrder(record as unknown as PBRecord));
}

export type OrdersTab = "progreso" | "hechos" | "cancelados" | "todos";

const TAB_STATUS_FILTERS: Record<OrdersTab, string | undefined> = {
  progreso: '(status = "PENDING" || status = "IN_PROGRESS")',
  hechos: 'status = "DONE"',
  cancelados: 'status = "CANCELLED"',
  todos: undefined,
};

export async function getOrders(tab: OrdersTab): Promise<DashboardOrder[]> {
  const session = await requireSession();
  return fetchOrders(session, TAB_STATUS_FILTERS[tab] ?? undefined);
}

export async function getDashboardSummary() {
  const session = await requireSession();
  const orders = await fetchOrders(session);
  return {
    inProgress: orders.filter((o) => o.status === "PENDING" || o.status === "IN_PROGRESS").length,
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
    record = (await pb.collection("ttmcobuild_orders").getOne(orderId, { expand: "service" })) as unknown as PBRecord;
  } catch (error) {
    if (error && typeof error === "object" && "status" in error && error.status === 404) throw new Error("Pedido inexistente");
    throw error;
  }
  const order = mapOrder(record);
  if (order.clientId !== session.userId && !TEAM_ROLES.includes(session.role)) throw new Error("No autorizado");
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
      createdAt: toDate(record.createdAt ?? ""),
      mine: String(record.author) === session.userId,
    };
  });
}

export async function getChatThread(orderId: string) {
  const session = await requireSession();
  const order = await getOrderOrFail(session, orderId);
  const messages = await listMessages(session, order.id);
  return { order, messages };
}

export async function sendChatMessage(orderId: string, message: string) {
  const session = await requireSession();
  const text = message.trim();
  if (!text) throw new Error("El mensaje está vacío.");
  if (text.length > 5000) throw new Error("El mensaje es demasiado largo.");

  const order = await getOrderOrFail(session, orderId);
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
    authorRole: session.role,
    message: text,
    createdAt: now,
    updatedAt: now,
  })) as unknown as PBRecord;

  revalidatePath("/dashboard/chats");
  return {
    id: record.id,
    orderId: String(record.order),
    authorName,
    authorRole: session.role,
    message: text,
    createdAt: toDate(record.createdAt ?? ""),
    mine: true,
  } satisfies ChatMessage;
}

export type ChatListItem = {
  orderId: string;
  serviceTitle: string;
  orderStatus: OrderStatus;
  orderCreatedAt: Date;
  messageCount: number;
  lastMessage: { text: string; authorName: string; createdAt: Date } | null;
};

export async function getChatList(): Promise<ChatListItem[]> {
  const session = await requireSession();
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

  return orders
    .map((order) => {
      const list = byOrder.get(order.id) ?? [];
      const last = list[list.length - 1];
      return {
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
}
