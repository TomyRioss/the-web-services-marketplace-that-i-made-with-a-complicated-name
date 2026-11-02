"use server";

import { revalidatePath } from "next/cache";
import { ensurePocketBaseAdmin, pbFilterValue, toDate } from "@/lib/pocketbase";
import { getSession } from "@/lib/auth/session";
import type { OrderStatus, Role } from "@/lib/data-types";

type ChatRecord = {
  id: string;
  order?: string;
  recipient?: string;
  author?: string;
  authorRole?: string;
  message?: string;
  attachments?: string[];
  createdAt?: string;
  expand?: {
    author?: { fullName?: string; email?: string; role?: string };
  };
};

async function requireCurrentSession() {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");
  const pb = await ensurePocketBaseAdmin();
  const profile = await pb.collection("ttmcobuild_profiles").getOne(session.userId, {
    fields: "id,role",
    cache: "no-store",
  });
  const role = profile.role as Role;
  if (!["OWNER", "ADMIN", "DEV", "CLIENTE"].includes(role)) throw new Error("No autorizado");
  return { ...session, role };
}

async function requireTeam() {
  const session = await requireCurrentSession();
  if (!["OWNER", "ADMIN", "DEV"].includes(session.role)) throw new Error("No autorizado");
  return session;
}

function requireManager(role: Role) {
  if (role !== "OWNER" && role !== "ADMIN") throw new Error("No autorizado");
}

export async function getTeamChatOrders() {
  const session = await requireTeam();
  requireManager(session.role);
  const pb = await ensurePocketBaseAdmin();
  const filter = session.role === "DEV" ? `assignedDev = ${pbFilterValue(session.userId)}` : undefined;
  const orders = await pb.collection("ttmcobuild_orders").getFullList({
    ...(filter ? { filter } : {}),
    expand: "service,client",
    sort: "-updatedAt",
  });
  const allMessages = (await pb.collection("ttmcobuild_chat_messages").getFullList({
    expand: "author",
    sort: "createdAt",
  })) as unknown as ChatRecord[];
  const messagesByOrder = new Map<string, ChatRecord[]>();
  for (const message of allMessages) {
    if (!message.order) continue;
    const list = messagesByOrder.get(message.order) ?? [];
    list.push(message);
    messagesByOrder.set(message.order, list);
  }

  return orders.map((order) => {
    const messages = messagesByOrder.get(order.id) ?? [];
    const last = messages[messages.length - 1];
    return {
      id: order.id,
      serviceTitle: order.expand?.service?.title ?? "Pedido",
      status: order.status as OrderStatus,
      clientName: order.expand?.client?.fullName || order.expand?.client?.email || "Cliente",
      clientEmail: order.expand?.client?.email ?? "",
      createdAt: toDate(order.createdAt),
      messageCount: messages.length,
      lastMessage: last
        ? {
            text: last.message ?? "",
            authorName: last.expand?.author?.fullName || last.expand?.author?.email || "Equipo",
            createdAt: toDate(last.createdAt ?? ""),
          }
        : null,
    };
  }).sort((a, b) => (b.lastMessage?.createdAt ?? b.createdAt).getTime() - (a.lastMessage?.createdAt ?? a.createdAt).getTime());
}

export async function getTeamChatContacts() {
  const session = await requireTeam();
  requireManager(session.role);
  const pb = await ensurePocketBaseAdmin();
  const profiles = await pb.collection("ttmcobuild_profiles").getFullList({ sort: "fullName,email" });
  return profiles
    .filter((profile) => profile.id !== session.userId)
    .map((profile) => ({
      id: profile.id,
      name: profile.fullName || profile.email,
      email: profile.email,
      role: profile.role as Role,
    }));
}

async function getDirectMessages(session: { userId: string; role: Role }, otherUserId: string) {
  const pb = await ensurePocketBaseAdmin();
  const messages = (await pb.collection("ttmcobuild_chat_messages").getFullList({
    filter: `((author = ${pbFilterValue(session.userId)} && recipient = ${pbFilterValue(otherUserId)}) || (author = ${pbFilterValue(otherUserId)} && recipient = ${pbFilterValue(session.userId)}))`,
    expand: "author",
    sort: "createdAt",
  })) as unknown as ChatRecord[];

  if (session.role === "CLIENTE") {
    const hasStaffMessage = messages.some((message) => message.author === otherUserId && ["OWNER", "ADMIN"].includes(message.authorRole ?? ""));
    if (!hasStaffMessage) throw new Error("Este chat todavía no está disponible.");
  }
  if (session.role === "DEV") {
    const hasTeamMessage = messages.some((message) => message.author === otherUserId && ["OWNER", "ADMIN"].includes(message.authorRole ?? ""));
    if (!hasTeamMessage) throw new Error("No autorizado");
  }
  return { pb, messages };
}

export async function getDirectChatThread(otherUserId: string) {
  const session = await requireCurrentSession();
  if (!["OWNER", "ADMIN", "CLIENTE"].includes(session.role)) throw new Error("No autorizado");
  if (!/^[a-zA-Z0-9]{15}$/.test(otherUserId) || otherUserId === session.userId) throw new Error("Usuario inválido.");

  const { pb, messages } = await getDirectMessages(session, otherUserId);
  const otherUser = await pb.collection("ttmcobuild_profiles").getOne(otherUserId);
  if (session.role === "CLIENTE" && !["OWNER", "ADMIN"].includes(otherUser.role)) throw new Error("No autorizado");
  return {
    sessionRole: session.role,
    contact: { id: otherUser.id, name: otherUser.fullName || otherUser.email, email: otherUser.email, role: otherUser.role },
    messages: messages.map((message) => ({
      id: message.id,
      orderId: "",
      authorName: message.expand?.author?.fullName || message.expand?.author?.email || "Equipo",
      authorRole: String(message.authorRole ?? ""),
      message: message.message ?? "",
      attachments: (message.attachments ?? []).map((name) => ({
        name,
        kind: /\.(jpe?g|png|webp|gif|avif)$/i.test(name) ? "image" as const : "audio" as const,
        url: `/api/chat/media/${message.id}/${encodeURIComponent(name)}`,
      })),
      createdAt: toDate(message.createdAt ?? ""),
      mine: message.author === session.userId,
    })),
  };
}

export async function sendDirectChatMessage(otherUserId: string, message: string) {
  const session = await requireCurrentSession();
  if (!["OWNER", "ADMIN", "CLIENTE"].includes(session.role)) throw new Error("No autorizado");
  if (!/^[a-zA-Z0-9]{15}$/.test(otherUserId) || otherUserId === session.userId) throw new Error("Usuario inválido.");
  const text = message.trim();
  if (!text) throw new Error("El mensaje está vacío.");
  if (text.length > 5000) throw new Error("El mensaje es demasiado largo.");

  const { pb } = await getDirectMessages(session, otherUserId);
  const recipient = await pb.collection("ttmcobuild_profiles").getOne(otherUserId);
  if (session.role === "CLIENTE" && !["OWNER", "ADMIN"].includes(recipient.role)) throw new Error("No autorizado");
  const now = new Date().toISOString();
  const record = (await pb.collection("ttmcobuild_chat_messages").create({
    recipient: otherUserId,
    author: session.userId,
    authorRole: session.role,
    message: text,
    createdAt: now,
    updatedAt: now,
  })) as unknown as ChatRecord;
  revalidatePath("/dashboard/chats");
  revalidatePath("/admin/chats");
  return {
    id: record.id,
    orderId: "",
    authorName: "Vos",
    authorRole: session.role,
    message: text,
    createdAt: toDate(record.createdAt ?? now),
    mine: true,
  };
}

export async function getDirectChatList() {
  const session = await requireCurrentSession();
  if (session.role === "DEV") return [];
  const pb = await ensurePocketBaseAdmin();
  const records = (await pb.collection("ttmcobuild_chat_messages").getFullList({
    filter: `(author = ${pbFilterValue(session.userId)} || recipient = ${pbFilterValue(session.userId)})`,
    expand: "author",
    sort: "createdAt",
  })) as unknown as ChatRecord[];
  const byContact = new Map<string, ChatRecord[]>();
  for (const record of records) {
    const contactId = record.author === session.userId ? record.recipient : record.author;
    if (!contactId) continue;
    const group = byContact.get(contactId) ?? [];
    group.push(record);
    byContact.set(contactId, group);
  }

  const chats = [];
  for (const [contactId, messages] of byContact) {
    const contact = await pb.collection("ttmcobuild_profiles").getOne(contactId);
    if (session.role === "CLIENTE" && !["OWNER", "ADMIN"].includes(contact.role)) continue;
    const last = messages[messages.length - 1];
    chats.push({
      contactId,
      contactName: contact.fullName || contact.email,
      contactRole: contact.role,
      messageCount: messages.length,
      lastMessage: last?.message ?? "",
      lastAuthorName: last?.expand?.author?.fullName || last?.expand?.author?.email || "Equipo",
      updatedAt: toDate(last?.createdAt ?? ""),
    });
  }
  return chats.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}
