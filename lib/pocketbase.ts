import "server-only";
import PocketBase from "pocketbase";

const globalForPocketBase = globalThis as unknown as { pocketbase?: PocketBase };
let pocketbase = globalForPocketBase.pocketbase;

function getPocketBase() {
  if (pocketbase) return pocketbase;

  const url = process.env.POCKETBASE_URL?.trim();
  if (!url) throw new Error("Falta configurar POCKETBASE_URL.");

  const pb = new PocketBase(url);
  pb.autoCancellation(false);
  pocketbase = pb;
  if (process.env.NODE_ENV !== "production") globalForPocketBase.pocketbase = pb;
  return pb;
}

export async function ensurePocketBaseAdmin() {
  const pocketbase = getPocketBase();
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
