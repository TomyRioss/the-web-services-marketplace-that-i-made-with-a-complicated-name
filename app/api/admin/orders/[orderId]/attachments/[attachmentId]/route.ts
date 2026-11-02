import { ensurePocketBaseAdmin } from "@/lib/pocketbase";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string; attachmentId: string }> }
) {
  const session = await getSession();
  if (!session) return new Response("No autorizado", { status: 401 });
  if (session.role !== "OWNER" && session.role !== "ADMIN") return new Response("No autorizado", { status: 403 });

  const { orderId, attachmentId } = await params;
  if (![orderId, attachmentId].every((id) => /^[a-zA-Z0-9]{15}$/.test(id))) return new Response("No encontrado", { status: 404 });

  const pb = await ensurePocketBaseAdmin();
  let attachment;
  try {
    attachment = await pb.collection("ttmcobuild_order_attachments").getOne(attachmentId);
  } catch {
    return new Response("No encontrado", { status: 404 });
  }
  if (attachment.order !== orderId) return new Response("No encontrado", { status: 404 });

  const token = await pb.files.getToken();
  const fileUrl = pb.files.getURL(attachment, attachment.image, { token });
  const file = await fetch(fileUrl, { cache: "no-store" });
  if (!file.ok || !file.body) return new Response("No encontrado", { status: 404 });

  return new Response(file.body, {
    headers: {
      "Content-Type": file.headers.get("content-type") ?? "application/octet-stream",
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
