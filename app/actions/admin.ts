"use server";

import { ensurePocketBaseAdmin, toDate } from "@/lib/pocketbase";
import type { Role } from "@/lib/data-types";
import { getSession } from "@/lib/auth/session";

function requireOwner(role: string) {
  if (role !== "OWNER") throw new Error("No autorizado");
}

export async function getAllUsers() {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");
  requireOwner(session.role);

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
