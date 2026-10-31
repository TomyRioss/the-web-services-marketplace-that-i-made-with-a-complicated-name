import Database from "better-sqlite3";
import PocketBase from "pocketbase";

const sourcePath = process.env.SQLITE_SOURCE ?? "migration-source/ttmcobuild.sqlite";
const pbUrl = process.env.POCKETBASE_URL;
const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;

const source = new Database(sourcePath, { readonly: true, fileMustExist: true });
const profiles = source.prepare('SELECT * FROM "Profile" ORDER BY "createdAt"').all();
const services = source.prepare('SELECT * FROM "Service" ORDER BY "createdAt"').all();
const orders = source.prepare('SELECT * FROM "Order" ORDER BY "createdAt"').all();

if (process.argv.includes("--counts")) {
  console.log(`Fuente SQLite: ${profiles.length} perfiles, ${services.length} servicios, ${orders.length} pedidos.`);
  source.close();
  process.exit(0);
}

if (!pbUrl || !adminEmail || !adminPassword) {
  throw new Error("Configure POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL y POCKETBASE_ADMIN_PASSWORD.");
}

const pb = new PocketBase(pbUrl);
pb.autoCancellation(false);

await pb.collection("_superusers").authWithPassword(adminEmail, adminPassword);

function iso(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("La base SQLite contiene una fecha inválida.");
  return date.toISOString();
}

function json(value, fallback) {
  if (Array.isArray(value) || (value && typeof value === "object")) return value;
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function findByLegacyId(collection, legacyId) {
  const escaped = String(legacyId).replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  const result = await pb.collection(collection).getList(1, 1, {
    filter: `legacyId = "${escaped}"`,
  });
  return result.items[0] ?? null;
}

async function upsert(collection, legacyId, data) {
  const existing = await findByLegacyId(collection, legacyId);
  return existing
    ? pb.collection(collection).update(existing.id, data)
    : pb.collection(collection).create({ legacyId, ...data });
}

const profileIds = new Map();
for (const profile of profiles) {
  const record = await upsert("ttmcobuild_profiles", profile.id, {
    email: profile.email,
    passwordHash: profile.passwordHash,
    fullName: profile.fullName ?? "",
    phone: profile.phone ?? "",
    role: profile.role,
    createdAt: iso(profile.createdAt),
    updatedAt: iso(profile.updatedAt),
  });
  profileIds.set(profile.id, record.id);
}

const serviceIds = new Map();
for (const service of services) {
  const record = await upsert("ttmcobuild_services", service.id, {
    title: service.title,
    description: service.description,
    priceArs: service.priceArs,
    priceUsd: service.priceUsd,
    deliveryDays: service.deliveryDays,
    portfolioUrls: json(service.portfolioUrls, []),
    references: json(service.references, []),
    active: Boolean(service.active),
    createdAt: iso(service.createdAt),
    updatedAt: iso(service.updatedAt),
  });
  serviceIds.set(service.id, record.id);
}

for (const order of orders) {
  const serviceId = serviceIds.get(order.serviceId);
  const clientId = profileIds.get(order.clientId);
  if (!serviceId || !clientId) throw new Error("Un pedido refiere a un servicio o perfil inexistente.");

  await upsert("ttmcobuild_orders", order.id, {
    service: serviceId,
    client: clientId,
    message: order.message,
    status: order.status,
    createdAt: iso(order.createdAt),
    updatedAt: iso(order.updatedAt),
  });
}

const [storedProfiles, storedServices, storedOrders] = await Promise.all([
  pb.collection("ttmcobuild_profiles").getFullList({ fields: "id,legacyId,passwordHash" }),
  pb.collection("ttmcobuild_services").getFullList({ fields: "id,legacyId" }),
  pb.collection("ttmcobuild_orders").getFullList({ fields: "id,legacyId,service,client" }),
]);
const profileByLegacyId = new Map(storedProfiles.map((record) => [record.legacyId, record]));
const serviceByLegacyId = new Map(storedServices.map((record) => [record.legacyId, record]));
const profileIdsPresent = new Set(storedProfiles.map((record) => record.id));
const serviceIdsPresent = new Set(storedServices.map((record) => record.id));

if (
  storedProfiles.length !== profiles.length ||
  storedServices.length !== services.length ||
  storedOrders.length !== orders.length
) {
  throw new Error("La verificación de cantidades no coincide con la fuente SQLite.");
}

for (const profile of profiles) {
  if (profileByLegacyId.get(profile.id)?.passwordHash !== profile.passwordHash) {
    throw new Error("La verificación de un perfil no coincide con SQLite.");
  }
}

for (const service of services) {
  if (!serviceByLegacyId.has(service.id)) throw new Error("Falta un servicio migrado.");
}

for (const order of orders) {
  const serviceId = serviceIds.get(order.serviceId);
  const clientId = profileIds.get(order.clientId);
  const stored = storedOrders.find((record) => record.legacyId === order.id);
  if (!stored || stored.service !== serviceId || stored.client !== clientId) {
    throw new Error("La verificación de relaciones de pedidos no coincide con SQLite.");
  }
  if (!serviceIdsPresent.has(stored.service) || !profileIdsPresent.has(stored.client)) {
    throw new Error("Se detectó una relación incompleta en PocketBase.");
  }
}

console.log(`Migración verificada: ${profiles.length} perfiles, ${services.length} servicios, ${orders.length} pedidos.`);
source.close();
