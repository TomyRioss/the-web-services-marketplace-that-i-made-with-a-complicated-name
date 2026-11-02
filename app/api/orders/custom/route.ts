import { ensurePocketBaseAdmin } from "@/lib/pocketbase";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Iniciá sesión para enviar tu pedido." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "No pudimos leer tu pedido." }, { status: 400 });
  }
  const message = typeof body === "object" && body !== null && "message" in body
    ? String((body as { message: unknown }).message).trim()
    : "";
  if (!message) return Response.json({ error: "Contanos qué tenés en mente." }, { status: 400 });
  if (message.length > 20000) return Response.json({ error: "El texto supera el límite permitido." }, { status: 400 });

  const pb = await ensurePocketBaseAdmin();
  const now = new Date().toISOString();
  const order = await pb.collection("ttmcobuild_orders").create({
    client: session.userId,
    message,
    isCustom: true,
    status: "PENDING",
    createdAt: now,
    updatedAt: now,
  });
  return Response.json({ orderId: order.id });
}
