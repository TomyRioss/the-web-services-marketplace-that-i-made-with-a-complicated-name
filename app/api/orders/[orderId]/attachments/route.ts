import { ensurePocketBaseAdmin } from "@/lib/pocketbase";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Iniciá sesión para continuar." }, { status: 401 });
  const { orderId } = await params;
  if (!/^[a-zA-Z0-9]{15}$/.test(orderId)) return Response.json({ error: "Pedido no válido." }, { status: 400 });

  const pb = await ensurePocketBaseAdmin();
  let order;
  try {
    order = await pb.collection("ttmcobuild_orders").getOne(orderId);
  } catch {
    return Response.json({ error: "No encontramos el pedido." }, { status: 404 });
  }
  if (order.client !== session.userId) return Response.json({ error: "No autorizado." }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return Response.json({ error: "Elegí una imagen válida." }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) return Response.json({ error: "Usá una imagen JPG, PNG, WebP o GIF." }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return Response.json({ error: "Cada imagen puede pesar hasta 50 MB." }, { status: 400 });

  const current = await pb.collection("ttmcobuild_order_attachments").getFullList({ filter: `order = "${orderId}"` });
  if (current.length >= 5) return Response.json({ error: "Podés adjuntar hasta 5 imágenes." }, { status: 400 });
  await pb.collection("ttmcobuild_order_attachments").create({ order: orderId, image: file });
  return Response.json({ uploaded: true });
}
