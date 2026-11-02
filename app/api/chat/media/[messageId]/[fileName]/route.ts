import "server-only";
import { getChatThread } from "@/app/actions/dashboard";
import { getDirectChatThread } from "@/app/actions/team-chats";
import { getSession } from "@/lib/auth/session";
import { ensurePocketBaseAdmin } from "@/lib/pocketbase";

export const runtime = "nodejs";

type ChatRecord = { id: string; order?: string; recipient?: string; author?: string; attachments?: string[] };

async function canReadMessage(message: ChatRecord, userId: string) {
  if (message.order) {
    const thread = await getChatThread(message.order);
    return thread.messages.some((item) => item.id === message.id);
  }
  const contactId = message.author === userId ? message.recipient : message.author;
  if (!contactId) return false;
  const thread = await getDirectChatThread(contactId);
  return thread.messages.some((item) => item.id === message.id);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ messageId: string; fileName: string }> }
) {
  const session = await getSession();
  if (!session) return new Response("No autorizado", { status: 401 });
  const { messageId, fileName } = await params;
  if (!/^[a-zA-Z0-9]{15}$/.test(messageId)) return new Response("No encontrado", { status: 404 });

  try {
    const pb = await ensurePocketBaseAdmin();
    const message = await pb.collection("ttmcobuild_chat_messages").getOne(messageId) as unknown as ChatRecord;
    const name = decodeURIComponent(fileName);
    if (!(message.attachments ?? []).includes(name) || !(await canReadMessage(message, session.userId))) {
      return new Response("No encontrado", { status: 404 });
    }
    const token = await pb.files.getToken();
    const fileUrl = pb.files.getURL(message, name, { token });
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
  } catch {
    return new Response("No encontrado", { status: 404 });
  }
}
