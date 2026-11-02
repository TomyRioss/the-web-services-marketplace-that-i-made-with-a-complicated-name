"use server";

import { revalidatePath } from "next/cache";
import { ensurePocketBaseAdmin } from "@/lib/pocketbase";
import { getSession } from "@/lib/auth/session";

const COLLECTION = "ttmcobuild_dashboard_ads";
const DEFAULT_IMAGE = "/images/devta-anuncio.png";
const LAUNCH_IMAGE = "/images/devta-anuncio-lanzamiento.png";
const DEFAULT_HREF = "/dashboard/marketplace/programacion-web";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export type DashboardAd = {
  id: string | null;
  slot: "home" | "launch";
  title: string;
  imageUrl: string;
  href: string;
  active: boolean;
};

export type DashboardAdFormState = {
  error: string | null;
  saved: boolean;
};

type DashboardAdRecord = {
  id: string;
  slot?: string;
  image?: string;
  imageUrl?: string;
  href?: string;
  active?: boolean;
};

function requireAdsManager(role: string) {
  if (role !== "OWNER" && role !== "ADMIN") throw new Error("No autorizado");
}

async function findHomeAd(pb: Awaited<ReturnType<typeof ensurePocketBaseAdmin>>) {
  const result = await pb.collection(COLLECTION).getFullList({
    sort: "slot",
  });
  return result as unknown as DashboardAdRecord[];
}

function mapAd(
  pb: Awaited<ReturnType<typeof ensurePocketBaseAdmin>>,
  record: DashboardAdRecord | undefined,
  slot: "home" | "launch",
): DashboardAd {
  return {
    id: record?.id ?? null,
    slot,
    title: slot === "launch" ? "Promoción de lanzamiento" : "Imaginate esa web fuera de tu cabeza",
    imageUrl: record?.image
      ? pb.files.getURL(record, record.image)
      : record?.imageUrl || (slot === "launch" ? LAUNCH_IMAGE : DEFAULT_IMAGE),
    href: record?.href || DEFAULT_HREF,
    active: record?.active ?? true,
  };
}

export async function getDashboardAd() {
  const session = await getSession();
  if (!session) return null;

  const pb = await ensurePocketBaseAdmin();
  const records = await findHomeAd(pb);
  return records
    .map((record) => mapAd(pb, record, record.slot === "launch" ? "launch" : "home"))
    .filter((ad) => ad.active);
}

export async function getDashboardAdConfig() {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");
  requireAdsManager(session.role);

  const pb = await ensurePocketBaseAdmin();
  const records = await findHomeAd(pb);
  return (["home", "launch"] as const).map((slot) =>
    mapAd(pb, records.find((record) => record.slot === slot), slot),
  );
}

export async function saveDashboardAd(
  _previousState: DashboardAdFormState,
  formData: FormData,
): Promise<DashboardAdFormState> {
  const session = await getSession();
  if (!session) return { error: "Iniciá sesión para continuar.", saved: false };
  if (session.role !== "OWNER" && session.role !== "ADMIN") {
    return { error: "No tenés permiso para editar este anuncio.", saved: false };
  }

  const href = String(formData.get("href") ?? "").trim();
  if (!isAllowedHref(href)) {
    return { error: "Ingresá una ruta interna o un enlace http/https válido.", saved: false };
  }

  const imageValue = formData.get("image");
  const image = imageValue instanceof File && imageValue.size > 0 ? imageValue : null;
  if (imageValue && !(imageValue instanceof File)) {
    return { error: "Seleccioná un archivo de imagen válido.", saved: false };
  }
  if (image && !ALLOWED_IMAGE_TYPES.has(image.type)) {
    return { error: "Usá una imagen JPG, PNG, WebP o GIF.", saved: false };
  }
  if (image && image.size > MAX_IMAGE_SIZE) {
    return { error: "La imagen debe pesar hasta 5 MB.", saved: false };
  }

  try {
    const pb = await ensurePocketBaseAdmin();
    const slotValue = String(formData.get("slot") ?? "home");
    if (slotValue !== "home" && slotValue !== "launch") {
      return { error: "Seleccioná un anuncio válido.", saved: false };
    }
    const slot = slotValue;
    const records = await findHomeAd(pb);
    const existing = records.find((record) => record.slot === slot);
    if (!existing && !image) {
      return { error: "Subí una imagen para crear el anuncio.", saved: false };
    }

    const data = new FormData();
    data.set("slot", slot);
    data.set("href", href);
    data.set("active", String(formData.get("active") === "on"));
    if (image) data.set("image", image, image.name);
    if (!existing && !image) data.set("imageUrl", slot === "launch" ? LAUNCH_IMAGE : DEFAULT_IMAGE);

    if (existing) {
      await pb.collection(COLLECTION).update(existing.id, data);
    } else {
      await pb.collection(COLLECTION).create(data);
    }

    revalidatePath("/dashboard");
    revalidatePath("/admin/dashboard-ads");
    return { error: null, saved: true };
  } catch (error) {
    console.error("No se pudo guardar el anuncio del dashboard.", error);
    return { error: "No se pudo guardar el anuncio. Revisá la conexión e intentá otra vez.", saved: false };
  }
}

function isAllowedHref(value: string) {
  if (!value || value.length > 2048 || /[\u0000-\u001f\\]/.test(value)) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
