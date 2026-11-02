import "server-only";
import { getChatThread } from "@/app/actions/dashboard";
import { getDirectChatThread } from "@/app/actions/team-chats";
import { getSession } from "@/lib/auth/session";
import { ensurePocketBaseAdmin } from "@/lib/pocketbase";
import { createClientNotification } from "@/lib/notification-delivery";

export const runtime = "nodejs";

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const audioTypes = new Set(["audio/mpeg", "audio/mp4", "audio/ogg", "audio/wav", "audio/webm", "audio/aac", "audio/x-m4a"]);
const allowedTypes = new Set([...imageTypes, ...audioTypes]);
const idPattern = /^[a-zA-Z0-9]{15}$/;

type ChatRecord = {
  id: string;
  order?: string;
  recipient?: string;
  author?: string;
  authorRole?: string;
  message?: string;
  attachments?: string[];
  createdAt?: string;
};

function attachmentData(messageId: string, names: string[]) {
  return names.map((name) => ({
    name,
    kind: /\.(jpe?g|png|webp|gif|avif)$/i.test(name) ? "image" : "audio",
    url: `/api/chat/media/${messageId}/${encodeURIComponent(name)}`,
  }));
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Iniciá sesión para enviar archivos." }, { status: 401 });

  try {
    const form = await request.formData();
    const orderId = String(form.get("orderId") ?? "");
    const contactId = String(form.get("contactId") ?? "");
    const text = String(form.get("message") ?? "").trim();
    const files = form.getAll("attachments").filter((value): value is File => value instanceof File && value.size > 0);
    if ((Boolean(orderId) === Boolean(contactId)) || (orderId && !idPattern.test(orderId)) || (contactId && !idPattern.test(contactId))) {
      return Response.json({ error: "Chat inválido." }, { status: 400 });
    }
    if (!files.length || files.length > 5) return Response.json({ error: "Adjuntá entre 1 y 5 archivos." }, { status: 400 });
    if (text.length > 5000) return Response.json({ error: "El mensaje es demasiado largo." }, { status: 400 });
    if (files.some((file) => !allowedTypes.has(file.type) || file.size > 20 * 1024 * 1024)) {
      return Response.json({ error: "Usá imágenes o audios compatibles de hasta 20 MB cada uno." }, { status: 400 });
    }
    let authorRole = session.role;
    if (orderId) authorRole = (await getChatThread(orderId)).sessionRole;
    else authorRole = (await getDirectChatThread(contactId)).sessionRole;
    if (orderId && authorRole === "CLIENTE" && files.some((file) => !imageTypes.has(file.type))) {
      return Response.json({ error: "El comprobante debe ser una imagen." }, { status: 400 });
    }

    const pb = await ensurePocketBaseAdmin();
    const createdAt = new Date().toISOString();
    const payload = new FormData();
    if (orderId) payload.set("order", orderId);
    else payload.set("recipient", contactId);
    payload.set("author", session.userId);
    payload.set("authorRole", authorRole);
    payload.set("message", text || "Archivo adjunto");
    payload.set("createdAt", createdAt);
    payload.set("updatedAt", createdAt);
    for (const file of files) payload.append("attachments", file, file.name);
    const record = await pb.collection("ttmcobuild_chat_messages").create(payload) as unknown as ChatRecord;

    if (orderId && ["ADMIN", "OWNER"].includes(authorRole)) {
      try {
        const order = await pb.collection("ttmcobuild_orders").getOne(orderId, { expand: "client,service" });
        const author = await pb.collection("ttmcobuild_profiles").getOne(session.userId);
        await createClientNotification({
          recipientId: String(order.client), orderId, type: "MESSAGE",
          message: `Tenés un archivo nuevo de ${author.fullName || author.email || "el equipo"} sobre ${order.expand?.service?.title ?? "tu proyecto"}.`,
          href: `/dashboard/chats/${orderId}`, email: order.expand?.client?.email ?? "",
        });
      } catch (error) {
        console.error("No se pudo crear la notificación del archivo del chat.", error);
      }
    }

    return Response.json({
      id: record.id,
      orderId: record.order ?? "",
      authorName: "Vos",
      authorRole,
      message: text,
      attachments: attachmentData(record.id, record.attachments ?? []),
      createdAt: record.createdAt ?? createdAt,
      mine: true,
    });
  } catch (error) {
    console.error("No se pudo enviar el archivo del chat.", error);
    return Response.json({ error: error instanceof Error ? error.message : "No se pudo enviar el archivo." }, { status: 400 });
  }
}
