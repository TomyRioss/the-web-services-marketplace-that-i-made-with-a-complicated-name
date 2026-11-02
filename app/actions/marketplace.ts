"use server";

import { revalidatePath } from "next/cache";
import { ensurePocketBaseAdmin, toDate } from "@/lib/pocketbase";
import type { OrderStatus, Service } from "@/lib/data-types";
import { getSession } from "@/lib/auth/session";
import { inferServiceCategory, SERVICE_CATEGORIES } from "@/lib/service-categories";
import { normalizeWebUrl } from "@/lib/normalize-web-url";

function requireOwner(role: string) {
  if (role !== "OWNER") throw new Error("No autorizado");
}

function requireOrderManager(role: string) {
  if (role !== "OWNER" && role !== "ADMIN") throw new Error("No autorizado");
}

export type ServiceReference = { url: string; imageUrl?: string };

type PocketBaseServiceRecord = {
  id: string;
  title: string;
  description: string;
  priceArs: number;
  priceUsd: number;
  deliveryDays: number;
  category?: string;
  portfolioUrls?: string[];
  references?: ServiceReference[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

function mapService(record: PocketBaseServiceRecord): Service {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    priceArs: record.priceArs,
    priceUsd: record.priceUsd,
    deliveryDays: record.deliveryDays,
    category: record.category || inferServiceCategory(record.title, record.description),
    portfolioUrls: record.portfolioUrls ?? [],
    references: record.references ?? [],
    active: record.active,
    createdAt: toDate(record.createdAt),
    updatedAt: toDate(record.updatedAt),
  };
}

export async function getActiveServices() {
  const pb = await ensurePocketBaseAdmin();
  const records = await pb.collection("ttmcobuild_services").getFullList({
    filter: "active = true",
    sort: "-createdAt",
  });
  return records.map((record) => mapService(record as unknown as PocketBaseServiceRecord));
}

export async function getPortfolioProjects() {
  const pb = await ensurePocketBaseAdmin();
  const records = await pb.collection("ttmcobuild_services").getFullList({ sort: "-createdAt" });
  return records
    .map((record) => mapService(record as unknown as PocketBaseServiceRecord))
    .filter((service) => service.portfolioUrls.length > 0);
}

export async function getServiceById(id: string) {
  if (!/^[a-zA-Z0-9]{15}$/.test(id)) return null;

  const pb = await ensurePocketBaseAdmin();
  try {
    const record = await pb.collection("ttmcobuild_services").getOne(id);
    if (!record.active) return null;
    return mapService(record as unknown as PocketBaseServiceRecord);
  } catch (error) {
    if (error && typeof error === "object" && "status" in error && error.status === 404) return null;
    throw error;
  }
}

export async function getServicesByCategory(slug: string) {
  const category = SERVICE_CATEGORIES.find((item) => item.slug === slug);
  if (!category) return null;
  const services = await getActiveServices();
  return { category, services: services.filter((service) => service.category === slug) };
}

export async function getAllServices() {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");
  requireOwner(session.role);

  const pb = await ensurePocketBaseAdmin();
  const records = await pb.collection("ttmcobuild_services").getFullList({ sort: "-createdAt" });
  return records.map((record) => mapService(record as unknown as PocketBaseServiceRecord));
}

export async function createService(data: {
  title: string;
  description: string;
  priceArs: number;
  priceUsd: number;
  deliveryDays: number;
  category: string;
  portfolioUrls: string[];
  references: ServiceReference[];
}) {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");
  requireOwner(session.role);

  const pb = await ensurePocketBaseAdmin();
  const now = new Date().toISOString();
  const record = await pb.collection("ttmcobuild_services").create({ ...data, active: true, createdAt: now, updatedAt: now });
  revalidatePath("/marketplace");
  revalidatePath("/admin/services");
  return mapService(record as unknown as PocketBaseServiceRecord);
}

export async function updateService(
  id: string,
  data: {
    title: string;
    description: string;
    priceArs: number;
    priceUsd: number;
    deliveryDays: number;
    category: string;
    portfolioUrls: string[];
    references: ServiceReference[];
    active: boolean;
  }
) {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");
  requireOwner(session.role);

  const pb = await ensurePocketBaseAdmin();
  const record = await pb.collection("ttmcobuild_services").update(id, { ...data, updatedAt: new Date().toISOString() });
  revalidatePath("/marketplace");
  revalidatePath("/admin/services");
  return mapService(record as unknown as PocketBaseServiceRecord);
}

export async function deleteService(id: string) {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");
  requireOwner(session.role);

  const pb = await ensurePocketBaseAdmin();
  await pb.collection("ttmcobuild_services").delete(id);
  revalidatePath("/marketplace");
  revalidatePath("/admin/services");
}

export async function createOrder(serviceId: string, message: string, referenceLinks: string[] = []) {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");
  const cleanMessage = message.trim();
  if (!cleanMessage || cleanMessage.length > 20000) throw new Error("Revisá el detalle de tu pedido.");
  if (!Array.isArray(referenceLinks) || referenceLinks.length > 5) throw new Error("Podés agregar hasta 5 enlaces de referencia.");
  const cleanLinks = referenceLinks.map((link) => {
    if (typeof link !== "string" || link.length > 2048) throw new Error("Hay un enlace de referencia no válido.");
    try {
      return normalizeWebUrl(link);
    } catch {
      throw new Error("Ingresá un dominio válido, como sitio.com, o una URL con http:// o https://.");
    }
  });
  const orderMessage = cleanLinks.length
    ? `${cleanMessage}\n\nEnlaces de referencia:\n${cleanLinks.join("\n")}`
    : cleanMessage;

  const pb = await ensurePocketBaseAdmin();
  const service = await pb.collection("ttmcobuild_services").getOne(serviceId);
  if (!service.active) throw new Error("Servicio no disponible");

  const record = await pb.collection("ttmcobuild_orders").create({
    service: serviceId,
    client: session.userId,
    message: orderMessage,
    status: "PENDING",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  revalidatePath("/admin/orders");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/chats");
  return record;
}

export async function getAllOrders() {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");
  requireOrderManager(session.role);

  const pb = await ensurePocketBaseAdmin();
  const records = await pb.collection("ttmcobuild_orders").getFullList({
    expand: "service,client,assignedDev",
    sort: "-createdAt",
  });
  const attachmentRecords = await pb.collection("ttmcobuild_order_attachments").getFullList();
  const attachmentsByOrder = new Map<string, { id: string }[]>();
  for (const attachment of attachmentRecords) {
    const urls = attachmentsByOrder.get(attachment.order) ?? [];
    urls.push({ id: attachment.id });
    attachmentsByOrder.set(attachment.order, urls);
  }
  return records.map((record) => ({
    id: record.id,
    serviceId: record.service,
    clientId: record.client,
    message: record.message,
    status: record.status as OrderStatus,
    createdAt: toDate(record.createdAt),
    updatedAt: toDate(record.updatedAt),
    service: { title: record.expand?.service?.title ?? (record.isCustom ? "Pedido personalizado" : "Servicio eliminado") },
    isCustom: Boolean(record.isCustom),
    attachments: attachmentsByOrder.get(record.id) ?? [],
    client: {
      email: record.expand?.client?.email ?? "Usuario eliminado",
      phone: record.expand?.client?.phone ?? null,
    },
    assignedDevId: record.assignedDev ?? "",
    assignedDev: record.expand?.assignedDev
      ? {
          fullName: record.expand.assignedDev.fullName ?? "",
          email: record.expand.assignedDev.email ?? "",
        }
      : null,
  }));
}

export async function getAssignableDevelopers() {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");
  requireOrderManager(session.role);

  const pb = await ensurePocketBaseAdmin();
  const records = await pb.collection("ttmcobuild_profiles").getFullList({
    filter: 'role = "DEV"',
    sort: "fullName,email",
  });
  return records.map((record) => ({
    id: record.id,
    name: record.fullName || record.email,
    email: record.email,
  }));
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}

async function sendOrderAssignmentEmail(to: string, developerName: string, serviceTitle: string, orderId: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Falta configurar Resend.");

  const safeName = escapeHtml(developerName);
  const safeServiceTitle = escapeHtml(serviceTitle);
  const link = `https://ttmagencia.com/dashboard/orders?tab=progreso`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || "Devta <staff@ttmagencia.com>",
      to: [to],
      subject: `Te asignaron un pedido: ${serviceTitle.replace(/[\r\n]+/g, " ")}`,
      html: `<p>Hola ${safeName},</p><p>Te asignaron el pedido <strong>${safeServiceTitle}</strong>.</p><p><a href="${link}">Ver mis pedidos</a></p><p>Referencia: ${escapeHtml(orderId)}</p>`,
      text: `Hola ${developerName}, te asignaron el pedido ${serviceTitle}. Ingresá a ${link}`,
    }),
  });

  if (!response.ok) throw new Error("Resend rechazó el envío del correo.");
}

export async function assignOrderToDeveloper(orderId: string, developerId: string) {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");
  requireOrderManager(session.role);
  if (!/^[a-zA-Z0-9]{15}$/.test(orderId) || !/^[a-zA-Z0-9]{15}$/.test(developerId)) {
    throw new Error("Pedido o desarrollador inválido.");
  }

  const pb = await ensurePocketBaseAdmin();
  const [order, developer] = await Promise.all([
    pb.collection("ttmcobuild_orders").getOne(orderId, { expand: "service,assignedDev" }),
    pb.collection("ttmcobuild_profiles").getOne(developerId),
  ]);
  if (developer.role !== "DEV") throw new Error("Solo podés delegar pedidos a desarrolladores.");

  const previousDeveloperId = String(order.assignedDev ?? "");
  if (previousDeveloperId === developerId) return { emailSent: true, emailError: null, unchanged: true };

  await pb.collection("ttmcobuild_orders").update(orderId, {
    assignedDev: developerId,
    updatedAt: new Date().toISOString(),
  });

  let emailSent = false;
  let emailError: string | null = null;
  try {
    await sendOrderAssignmentEmail(
      developer.email,
      developer.fullName || developer.email,
      order.expand?.service?.title ?? "Pedido",
      orderId
    );
    emailSent = true;
  } catch (error) {
    emailError = error instanceof Error ? error.message : "No se pudo enviar el correo.";
  }

  revalidatePath("/admin/orders");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/chats");
  return { emailSent, emailError, developerName: developer.fullName || developer.email };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");
  requireOrderManager(session.role);

  const pb = await ensurePocketBaseAdmin();
  const record = await pb.collection("ttmcobuild_orders").update(orderId, { status, updatedAt: new Date().toISOString() });
  revalidatePath("/admin/orders");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/chats");
  return record;
}
