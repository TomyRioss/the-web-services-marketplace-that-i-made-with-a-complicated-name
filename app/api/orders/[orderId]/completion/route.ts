import { ensurePocketBaseAdmin } from "@/lib/pocketbase";
import { getSession } from "@/lib/auth/session";
import { getVideoDurationSeconds } from "@/lib/video-duration";
import { createClientNotification } from "@/lib/notification-delivery";
import { revalidatePath } from "next/cache";
import { getApprovedOrderPayments, isAdvancePaid } from "@/lib/order-payment-access";

export const runtime = "nodejs";

const orderIdPattern = /^[a-zA-Z0-9]{15}$/;
const screenshotTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const videoTypes = new Set(["video/mp4", "video/webm"]);
const maxScreenshotSize = 5 * 1024 * 1024;
const maxVideoSize = 50 * 1024 * 1024;

function isGitHubRepositoryUrl(value: string) {
  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);
    return url.protocol === "https:" && url.hostname === "github.com" && !url.username && !url.password &&
      !url.search && !url.hash && parts.length === 2 &&
      /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(parts[0]) &&
      /^[A-Za-z0-9._-]+(?:\.git)?$/.test(parts[1]);
  } catch {
    return false;
  }
}

function isPreviewUrl(value: string) {
  if (value === "N/A") return true;
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function imageMatchesMime(file: File, bytes: Uint8Array) {
  if (!screenshotTypes.has(file.type)) return false;
  if (file.type === "image/png") return bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
  if (file.type === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.type === "image/gif") return bytes.length >= 6 && String.fromCharCode(...bytes.slice(0, 6)).match(/^GIF8[79]a$/) !== null;
  return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
}

function revalidateOrderPages(orderId: string) {
  revalidatePath("/admin/orders");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/chats");
  revalidatePath(`/dashboard/chats/${orderId}`);
  revalidatePath("/dashboard/staff");
  revalidatePath(`/dashboard/staff/${orderId}`);
}

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Iniciá sesión para continuar." }, { status: 401 });
  if (session.role !== "DEV") return Response.json({ error: "Solo el desarrollador asignado puede completar este pedido." }, { status: 403 });

  const { orderId } = await params;
  if (!orderIdPattern.test(orderId)) return Response.json({ error: "Pedido inexistente." }, { status: 404 });

  try {
    const form = await request.formData();
    const repositoryUrl = String(form.get("repositoryUrl") ?? "").trim();
    const previewUrl = String(form.get("previewUrl") ?? "").trim();
    const screenshots = form.getAll("screenshots").filter((entry): entry is File => entry instanceof File && entry.size > 0);
    const demoVideo = form.get("demoVideo");
    const demoVideoFile = demoVideo instanceof File && demoVideo.size > 0 ? demoVideo : null;
    if (!isGitHubRepositoryUrl(repositoryUrl)) {
      return Response.json({ error: "Pegá el enlace HTTPS del repositorio en github.com." }, { status: 400 });
    }
    if (!isPreviewUrl(previewUrl)) {
      return Response.json({ error: "Pegá un enlace de vista previa válido o marcá N/A." }, { status: 400 });
    }
    if (screenshots.length < 1 || screenshots.length > 3) {
      return Response.json({ error: "Adjuntá entre 1 y 3 capturas de la web." }, { status: 400 });
    }
    if (screenshots.some((file) => file.size > maxScreenshotSize)) {
      return Response.json({ error: "Cada captura puede pesar hasta 5 MB." }, { status: 400 });
    }
    if (demoVideoFile && (demoVideoFile.size > maxVideoSize || !videoTypes.has(demoVideoFile.type))) {
      return Response.json({ error: "Adjuntá un video MP4 o WebM de hasta 50 MB." }, { status: 400 });
    }

    const imageBytes = await Promise.all(screenshots.map(async (file) => new Uint8Array(await file.arrayBuffer())));
    if (screenshots.some((file, index) => !imageMatchesMime(file, imageBytes[index]))) {
      return Response.json({ error: "Una de las capturas no coincide con su formato de imagen." }, { status: 400 });
    }
    let durationSeconds: number | null = null;
    if (demoVideoFile) {
      const videoBytes = new Uint8Array(await demoVideoFile.arrayBuffer());
      durationSeconds = getVideoDurationSeconds(videoBytes);
      if (durationSeconds === null) {
        return Response.json({ error: "No se pudo verificar la duración. Exportá la demo como MP4 o WebM y volvé a adjuntarla." }, { status: 400 });
      }
      if (durationSeconds < 20) {
        return Response.json({ error: "La demo debe durar al menos 20 segundos." }, { status: 400 });
      }
    }

    const pb = await ensurePocketBaseAdmin();
    const order = await pb.collection("ttmcobuild_orders").getOne(orderId, { expand: "service,client" });
    if (String(order.assignedDev ?? "") !== session.userId) {
      return Response.json({ error: "Este pedido no está asignado a tu cuenta." }, { status: 403 });
    }
    if (!isAdvancePaid(order as unknown as Parameters<typeof isAdvancePaid>[0], await getApprovedOrderPayments(pb, orderId))) {
      return Response.json({ error: "El anticipo debe estar confirmado antes de completar el pedido." }, { status: 409 });
    }
    if (!["PENDING", "IN_PROGRESS"].includes(String(order.status))) {
      return Response.json({ error: "Reabrí el pedido antes de enviar otra versión." }, { status: 409 });
    }
    const existing = await pb.collection("ttmcobuild_order_deliverables").getFullList({
      filter: `order = "${orderId}"`,
      fields: "id",
      perPage: 1,
    });

    const payload = new FormData();
    payload.set("order", orderId);
    payload.set("repositoryUrl", repositoryUrl);
    payload.set("previewUrl", previewUrl);
    if (durationSeconds !== null) payload.set("demoDuration", String(durationSeconds));
    screenshots.forEach((file, index) => payload.append("screenshots", file, file.name || `captura-${index + 1}`));
    if (demoVideoFile) payload.append("demoVideo", demoVideoFile, demoVideoFile.name || "demo");

    if (existing[0]) {
      payload.set("chatDeliveredAt", "");
      payload.set("emailDeliveredAt", "");
      payload.set("deliveryEmail", "");
      payload.set("deliveryToken", "");
      payload.set("deliveryTokenExpiresAt", "");
      await pb.collection("ttmcobuild_order_deliverables").update(String(existing[0].id), payload);
    } else {
      await pb.collection("ttmcobuild_order_deliverables").create(payload);
    }
    await pb.collection("ttmcobuild_orders").update(orderId, {
      status: "REVIEW",
      updatedAt: new Date().toISOString(),
    });

    try {
      await createClientNotification({
        recipientId: String(order.client),
        orderId,
        type: "STATUS",
        message: `${order.expand?.service?.title ?? "Tu proyecto"} está listo para que lo revises.`,
        href: `/dashboard/chats/${orderId}`,
        email: order.expand?.client?.email ?? "",
      });
    } catch (error) {
      console.error("No se pudo notificar al cliente sobre la entrega.", error);
    }

    revalidateOrderPages(orderId);
    return Response.json({ completed: true });
  } catch (error) {
    console.error("No se pudo completar el pedido con entregables.", error);
    return Response.json({ error: "No se pudo guardar la entrega. Volvé a intentarlo." }, { status: 500 });
  }
}
