"use server";

import { revalidatePath } from "next/cache";
import { ensurePocketBaseAdmin, pbFilterValue, toDate } from "@/lib/pocketbase";
import type { CommunicationPreference, OrderStatus, Service } from "@/lib/data-types";
import { getSession } from "@/lib/auth/session";
import { inferServiceCategory, SERVICE_CATEGORIES } from "@/lib/service-categories";
import { normalizeWebUrl } from "@/lib/normalize-web-url";
import { createClientNotification } from "@/lib/notification-delivery";
import { getCommunicationPreference } from "@/lib/order-preferences";
import { SERVICE_PRICING_DYNAMIC_PATHS, SERVICE_PRICING_STATIC_PATHS } from "@/lib/service-pricing-paths";

function requireServiceManager(role: string) {
  if (role !== "OWNER" && role !== "ADMIN") throw new Error("No autorizado");
}

function requireOrderManager(role: string) {
  if (role !== "OWNER" && role !== "ADMIN") throw new Error("No autorizado");
}

function revalidateServiceViews() {
  for (const path of SERVICE_PRICING_STATIC_PATHS) revalidatePath(path);
  for (const path of SERVICE_PRICING_DYNAMIC_PATHS) revalidatePath(path, "page");
}

export type ServiceReference = { url: string; imageUrl?: string };

type PocketBaseServiceRecord = {
  id: string;
  title: string;
  description: string;
  priceArs: number;
  priceUsd: number;
  advancePaymentPercent?: number;
  promotionActive?: boolean;
  promotionPriceArs?: number | null;
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
    advancePaymentPercent: Number.isInteger(record.advancePaymentPercent) && Number(record.advancePaymentPercent) >= 0 && Number(record.advancePaymentPercent) <= 100
      ? Number(record.advancePaymentPercent)
      : 100,
    promotionActive: Boolean(record.promotionActive && Number(record.promotionPriceArs) > 0 && Number(record.promotionPriceArs) < record.priceArs),
    promotionPriceArs: record.promotionPriceArs || null,
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
  requireServiceManager(session.role);

  const pb = await ensurePocketBaseAdmin();
  const records = await pb.collection("ttmcobuild_services").getFullList({ sort: "-createdAt" });
  return records.map((record) => mapService(record as unknown as PocketBaseServiceRecord));
}

export async function createService(data: {
  title: string;
  description: string;
  priceArs: number;
  priceUsd: number;
  advancePaymentPercent: number;
  promotionActive: boolean;
  promotionPriceArs: number;
  deliveryDays: number;
  category: string;
  portfolioUrls: string[];
  references: ServiceReference[];
}) {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");
  requireServiceManager(session.role);

  validateAdvancePaymentPercent(data.advancePaymentPercent);
  validatePromotion(data.priceArs, data.promotionActive, data.promotionPriceArs);

  const pb = await ensurePocketBaseAdmin();
  const now = new Date().toISOString();
  const record = await pb.collection("ttmcobuild_services").create({ ...data, active: true, createdAt: now, updatedAt: now });
  revalidateServiceViews();
  return mapService(record as unknown as PocketBaseServiceRecord);
}

export async function updateService(
  id: string,
  data: {
    title: string;
    description: string;
    priceArs: number;
    priceUsd: number;
    advancePaymentPercent: number;
    promotionActive: boolean;
    promotionPriceArs: number;
    deliveryDays: number;
    category: string;
    portfolioUrls: string[];
    references: ServiceReference[];
    active: boolean;
  }
) {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");
  requireServiceManager(session.role);

  validateAdvancePaymentPercent(data.advancePaymentPercent);
  validatePromotion(data.priceArs, data.promotionActive, data.promotionPriceArs);

  const pb = await ensurePocketBaseAdmin();
  const record = await pb.collection("ttmcobuild_services").update(id, { ...data, updatedAt: new Date().toISOString() });
  revalidateServiceViews();
  return mapService(record as unknown as PocketBaseServiceRecord);
}

function validatePromotion(priceArs: number, promotionActive: boolean, promotionPriceArs: number) {
  if (!promotionActive) return;
  if (!Number.isFinite(promotionPriceArs) || promotionPriceArs <= 0) {
    throw new Error("Ingresá un precio promocional válido.");
  }
  if (promotionPriceArs >= priceArs) {
    throw new Error("El precio promocional debe ser menor que el precio original.");
  }
}

function validateAdvancePaymentPercent(value: number) {
  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw new Error("El porcentaje de anticipo debe ser un número entero entre 0 y 100.");
  }
}

export async function deleteService(id: string) {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");
  requireServiceManager(session.role);

  const pb = await ensurePocketBaseAdmin();
  await pb.collection("ttmcobuild_services").delete(id);
  revalidateServiceViews();
}

export async function createOrder(
  serviceId: string,
  message: string,
  referenceLinks: string[] = [],
  communicationPreference: CommunicationPreference = "TALK_TO_ME"
) {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");
  const cleanMessage = message.trim();
  if (!cleanMessage || cleanMessage.length > 20000) throw new Error("Revisá el detalle de tu pedido.");
  if (communicationPreference !== "TALK_TO_ME" && communicationPreference !== "AUTONOMOUS") {
    throw new Error("Elegí una preferencia de comunicación válida.");
  }
  if (!Array.isArray(referenceLinks) || referenceLinks.length > 5) throw new Error("Podés agregar hasta 5 enlaces de referencia.");
  const cleanLinks = referenceLinks.map((link) => {
    if (typeof link !== "string" || link.length > 2048) throw new Error("Hay un enlace de referencia no válido.");
    try {
      return normalizeWebUrl(link);
    } catch {
      throw new Error("Ingresá un dominio válido, como sitio.com, o una URL con http:// o https://.");
    }
  });
  const preferenceLabel = communicationPreference === "TALK_TO_ME" ? "Quiero que me hablen" : "Trabajo autónomo";
  const orderMessage = [
    cleanMessage,
    `Preferencia de comunicación: ${preferenceLabel}`,
    cleanLinks.length ? `Enlaces de referencia:\n${cleanLinks.join("\n")}` : "",
  ].filter(Boolean).join("\n\n");

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
  revalidatePath("/dashboard", "layout");
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
    communicationPreference: getCommunicationPreference(record.message),
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
    assignmentNote: record.assignmentNote ?? "",
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
    filter: 'role = "DEV" || role = "ADMIN" || role = "OWNER"',
    sort: "fullName,email",
  });
  return records.map((record) => ({
    id: record.id,
    name: record.fullName || record.email,
    email: record.email,
    isCurrentUser: record.id === session.userId,
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

export async function assignOrderToDeveloper(orderId: string, developerId: string, assignmentNote = "") {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");
  requireOrderManager(session.role);
  if (!/^[a-zA-Z0-9]{15}$/.test(orderId) || !/^[a-zA-Z0-9]{15}$/.test(developerId)) {
    throw new Error("Pedido o desarrollador inválido.");
  }

  const note = assignmentNote.trim();
  if (note.length > 4000) throw new Error("La nota no puede superar los 4000 caracteres.");
  const pb = await ensurePocketBaseAdmin();
  const [order, developer] = await Promise.all([
    pb.collection("ttmcobuild_orders").getOne(orderId, { expand: "service,assignedDev,client" }),
    pb.collection("ttmcobuild_profiles").getOne(developerId),
  ]);
  if (!["DEV", "ADMIN", "OWNER"].includes(developer.role)) throw new Error("El usuario no puede recibir pedidos.");

  const previousDeveloperId = String(order.assignedDev ?? "");
  const recoverAssignmentNotification = async () => {
    if (!["DEV", "ADMIN", "OWNER"].includes(developer.role)) return null;
    const existingNotifications = await pb.collection("ttmcobuild_notifications").getFullList({
      filter: `order = ${pbFilterValue(orderId)} && recipient = ${pbFilterValue(String(order.client))} && type = "ASSIGNMENT"`,
      fields: "id",
      perPage: 1,
    });
    if (existingNotifications.length > 0) return null;
    const result = await createClientNotification({
      recipientId: String(order.client),
      orderId,
      type: "ASSIGNMENT",
      message: `Ya hay un desarrollador asignado a ${order.expand?.service?.title ?? "tu pedido"}.`,
      href: `/dashboard/chats/${orderId}`,
      email: order.expand?.client?.email ?? "",
    });
    return result;
  };
  if (previousDeveloperId === developerId && String(order.assignmentNote ?? "") === note && String(order.assignedBy ?? "") === session.userId) {
    const recoveredNotification = await recoverAssignmentNotification();
    if (recoveredNotification) {
      revalidatePath("/dashboard");
      revalidatePath("/dashboard", "layout");
      revalidatePath("/dashboard/notificaciones");
      return { emailSent: true, emailError: null, clientNotificationEmailError: recoveredNotification.emailError, unchanged: false };
    }
    return { emailSent: true, emailError: null, clientNotificationEmailError: null, unchanged: true };
  }

  await pb.collection("ttmcobuild_orders").update(orderId, {
    assignedDev: developerId,
    assignedBy: session.userId,
    assignmentNote: note,
    updatedAt: new Date().toISOString(),
  });

  if (previousDeveloperId === developerId) {
    const recoveredNotification = await recoverAssignmentNotification();
    revalidatePath("/admin/orders");
    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/staff");
    revalidatePath("/dashboard/notificaciones");
    return {
      emailSent: true,
      emailError: null,
      clientNotificationEmailError: recoveredNotification?.emailError ?? null,
      unchanged: !recoveredNotification,
    };
  }

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

  let clientNotificationEmailError: string | null = null;
  try {
    const serviceTitle = order.expand?.service?.title ?? "Pedido";
    const result = await createClientNotification({
      recipientId: String(order.client),
      orderId,
      type: "ASSIGNMENT",
      message: `Hay un desarrollador asignado a ${serviceTitle}.`,
      href: `/dashboard/chats/${orderId}`,
      email: order.expand?.client?.email ?? "",
    });
    clientNotificationEmailError = result.emailError;
  } catch (error) {
    clientNotificationEmailError = error instanceof Error ? error.message : "No se pudo crear la notificación del cliente.";
  }

  revalidatePath("/admin/orders");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/chats");
  revalidatePath("/dashboard/staff");
  return { emailSent, emailError, clientNotificationEmailError, developerName: developer.fullName || developer.email };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");
  requireOrderManager(session.role);

  const validStatuses: OrderStatus[] = ["PENDING", "IN_PROGRESS", "CANCELLED"];
  if (!/^[a-zA-Z0-9]{15}$/.test(orderId) || !validStatuses.includes(status)) throw new Error("Pedido o estado inválido.");

  const pb = await ensurePocketBaseAdmin();
  const previous = await pb.collection("ttmcobuild_orders").getOne(orderId, { expand: "service,client" });
  if (status === "DONE") throw new Error("El cliente debe aprobar la entrega para cerrar el pedido.");
  if (previous.status === status) return previous;

  const record = await pb.collection("ttmcobuild_orders").update(orderId, { status, updatedAt: new Date().toISOString() });
  try {
    const statusLabels: Record<OrderStatus, string> = {
      PENDING: "Pendiente",
      IN_PROGRESS: "En progreso",
      REVIEW: "En revisión",
      APPROVED: "Aprobado por el cliente",
      DONE: "Cerrado",
      CANCELLED: "Cancelado",
    };
    const serviceTitle = previous.expand?.service?.title ?? "Tu proyecto";
    await createClientNotification({
      recipientId: String(previous.client),
      orderId,
      type: "STATUS",
      message: `${serviceTitle} ahora está ${statusLabels[status].toLowerCase()}.`,
      href: `/dashboard/chats/${orderId}`,
      email: previous.expand?.client?.email ?? "",
    });
  } catch (error) {
    console.error("No se pudo crear la notificación del cambio de estado.", error);
  }
  revalidatePath("/admin/orders");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/chats");
  return record;
}
