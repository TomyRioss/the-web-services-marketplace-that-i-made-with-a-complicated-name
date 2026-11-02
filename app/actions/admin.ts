"use server";

import { revalidatePath } from "next/cache";
import { ensurePocketBaseAdmin, toDate } from "@/lib/pocketbase";
import type { Role } from "@/lib/data-types";
import { getSession } from "@/lib/auth/session";

function requireUserManager(role: string) {
  if (role !== "OWNER" && role !== "ADMIN") throw new Error("No autorizado");
}

export async function updateDeveloperAccess(userId: string, enabled: boolean) {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");
  requireUserManager(session.role);
  if (!/^[a-zA-Z0-9]{15}$/.test(userId)) throw new Error("Usuario inválido.");

  const pb = await ensurePocketBaseAdmin();
  const profile = await pb.collection("ttmcobuild_profiles").getOne(userId);
  if (enabled && profile.role !== "CLIENTE") throw new Error("Solo se puede habilitar como desarrollador a un cliente.");
  if (!enabled && profile.role !== "DEV") throw new Error("La cuenta ya no es de desarrollador.");

  if (!enabled) {
    const activeAssignments = await pb.collection("ttmcobuild_orders").getFullList({
      filter: `assignedDev = "${userId}" && status != "DONE" && status != "CANCELLED"`,
      fields: "id",
    });
    if (activeAssignments.length > 0) {
      throw new Error("No se puede quitar el acceso mientras tenga pedidos activos asignados.");
    }
  }

  await pb.collection("ttmcobuild_profiles").update(userId, {
    role: enabled ? "DEV" : "CLIENTE",
    updatedAt: new Date().toISOString(),
  });
  revalidatePath("/admin/users");
  revalidatePath("/admin/orders");
  revalidatePath("/dashboard");
}

export async function getAllUsers() {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");
  requireUserManager(session.role);

  const pb = await ensurePocketBaseAdmin();
  const [records, orders] = await Promise.all([
    pb.collection("ttmcobuild_profiles").getFullList({ sort: "-createdAt" }),
    pb.collection("ttmcobuild_orders").getFullList({ fields: "client" }),
  ]);
  const orderCounts = new Map<string, number>();
  for (const order of orders) orderCounts.set(order.client, (orderCounts.get(order.client) ?? 0) + 1);

  return records.map((record) => ({
    id: record.id,
    email: record.email,
    fullName: record.fullName || null,
    phone: record.phone || null,
    role: record.role as Role,
    createdAt: toDate(record.createdAt),
    updatedAt: toDate(record.updatedAt),
    _count: { orders: orderCounts.get(record.id) ?? 0 },
  }));
}
