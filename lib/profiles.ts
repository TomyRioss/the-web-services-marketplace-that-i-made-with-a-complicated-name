import "server-only";
import { ensurePocketBaseAdmin, toDate } from "@/lib/pocketbase";
import type { PublicProfile, Role } from "@/lib/data-types";

export async function getProfileById(id: string): Promise<PublicProfile | null> {
  const pb = await ensurePocketBaseAdmin();
  try {
    const record = await pb.collection("ttmcobuild_profiles").getOne(id);
    return {
      id: record.id,
      email: record.email,
      fullName: record.fullName || null,
      phone: record.phone || null,
      role: record.role as Role,
      createdAt: toDate(record.createdAt),
      updatedAt: toDate(record.updatedAt),
    };
  } catch (error) {
    if (error && typeof error === "object" && "status" in error && error.status === 404) return null;
    throw error;
  }
}
