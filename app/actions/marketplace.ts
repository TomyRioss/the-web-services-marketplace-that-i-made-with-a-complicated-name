"use server";

import { revalidatePath } from "next/cache";
import { ensurePocketBaseAdmin, toDate } from "@/lib/pocketbase";
import type { OrderStatus, Service } from "@/lib/data-types";
import { getSession } from "@/lib/auth/session";

function requireOwner(role: string) {
  if (role !== "OWNER") throw new Error("No autorizado");
}

export type ServiceReference = { url: string; imageUrl?: string };

type PocketBaseServiceRecord = {
  id: string;
  title: string;
  description: string;
  priceArs: number;
  priceUsd: number;
  deliveryDays: number;
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

export async function createOrder(serviceId: string, message: string) {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");

  const pb = await ensurePocketBaseAdmin();
  const service = await pb.collection("ttmcobuild_services").getOne(serviceId);
  if (!service.active) throw new Error("Servicio no disponible");

  const record = await pb.collection("ttmcobuild_orders").create({
    service: serviceId,
    client: session.userId,
    message,
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
  requireOwner(session.role);

  const pb = await ensurePocketBaseAdmin();
  const records = await pb.collection("ttmcobuild_orders").getFullList({
    expand: "service,client",
    sort: "-createdAt",
  });
  return records.map((record) => ({
    id: record.id,
    serviceId: record.service,
    clientId: record.client,
    message: record.message,
    status: record.status as OrderStatus,
    createdAt: toDate(record.createdAt),
    updatedAt: toDate(record.updatedAt),
    service: { title: record.expand?.service?.title ?? "Servicio eliminado" },
    client: {
      email: record.expand?.client?.email ?? "Usuario eliminado",
      phone: record.expand?.client?.phone ?? null,
    },
  }));
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");
  requireOwner(session.role);

  const pb = await ensurePocketBaseAdmin();
  const record = await pb.collection("ttmcobuild_orders").update(orderId, { status, updatedAt: new Date().toISOString() });
  revalidatePath("/admin/orders");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/chats");
  return record;
}
