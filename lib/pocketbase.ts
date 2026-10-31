import "server-only";
import PocketBase from "pocketbase";

const globalForPocketBase = globalThis as unknown as { pocketbase?: PocketBase };

function createPocketBase() {
  const url = process.env.POCKETBASE_URL;
  if (!url) throw new Error("Falta configurar POCKETBASE_URL.");

  const pb = new PocketBase(url);
  pb.autoCancellation(false);
  return pb;
}

export const pocketbase = globalForPocketBase.pocketbase ?? createPocketBase();

if (process.env.NODE_ENV !== "production") globalForPocketBase.pocketbase = pocketbase;

export async function ensurePocketBaseAdmin() {
  if (pocketbase.authStore.isValid) {
    try {
      await pocketbase.collection("_superusers").authRefresh();
      return pocketbase;
    } catch {
      pocketbase.authStore.clear();
    }
  }

  const email = process.env.POCKETBASE_ADMIN_EMAIL;
  const password = process.env.POCKETBASE_ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Falta configurar el acceso privado de PocketBase.");

  await pocketbase.collection("_superusers").authWithPassword(email, password);
  return pocketbase;
}

export function toDate(value: string) {
  return new Date(value);
}

export function pbFilterValue(value: string) {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}
