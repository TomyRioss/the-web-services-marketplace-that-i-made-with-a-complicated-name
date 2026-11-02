import { ensurePocketBaseAdmin, pbFilterValue } from "@/lib/pocketbase";
import { getSession } from "@/lib/auth/session";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string; fileName: string }> },
) {
  const session = await getSession();

  const { orderId, fileName } = await params;
  if (!/^[a-zA-Z0-9]{15}$/.test(orderId) || !fileName || fileName.length > 255 || /[\\/]/.test(fileName)) {
    return new Response("No encontrado", { status: 404 });
  }

  const pb = await ensurePocketBaseAdmin();
  let order;
  try {
    order = await pb.collection("ttmcobuild_orders").getOne(orderId);
  } catch {
    return new Response("No encontrado", { status: 404 });
  }

  let records;
  try {
    records = await pb.collection("ttmcobuild_order_deliverables").getFullList({
      filter: `order = ${pbFilterValue(orderId)}`,
      perPage: 1,
    });
  } catch {
    return new Response("No encontrado", { status: 404 });
  }
  const deliverables = records[0] as { id: string; screenshots?: string[]; demoVideo?: string; deliveryToken?: string; deliveryTokenExpiresAt?: string } | undefined;
  if (!deliverables) return new Response("No encontrado", { status: 404 });
  const suppliedToken = new URL(request.url).searchParams.get("token") ?? "";
  const storedToken = deliverables.deliveryToken ?? "";
  let tokenValid = false;
  if (/^[a-f0-9]{64}$/.test(suppliedToken) && /^[a-f0-9]{64}$/.test(storedToken)) {
    tokenValid = timingSafeEqual(Buffer.from(suppliedToken, "hex"), Buffer.from(storedToken, "hex"))
      && Boolean(deliverables.deliveryTokenExpiresAt)
      && new Date(deliverables.deliveryTokenExpiresAt!).getTime() > Date.now();
  }
  const isManager = session?.role === "ADMIN" || session?.role === "OWNER";
  const isAssignedDeveloper = session?.role === "DEV" && String(order.assignedDev ?? "") === session.userId;
  const isCustomer = session?.role === "CLIENTE" && String(order.client ?? "") === session.userId;
  if (!tokenValid && !isManager && !isAssignedDeveloper && !isCustomer) return new Response("No autorizado", { status: session ? 403 : 401 });
  const allowedFiles = [...(deliverables.screenshots ?? []), ...(deliverables.demoVideo ? [deliverables.demoVideo] : [])];
  if (!allowedFiles.includes(fileName)) return new Response("No encontrado", { status: 404 });

  try {
    const token = await pb.files.getToken();
    const fileUrl = pb.files.getURL(deliverables, fileName, { token });
    const range = request.headers.get("range");
    const file = await fetch(fileUrl, {
      cache: "no-store",
      headers: range ? { range } : undefined,
    });
    if (!file.ok || !file.body) return new Response("No encontrado", { status: 404 });

    const headers = new Headers({
      "Content-Type": file.headers.get("content-type") ?? "application/octet-stream",
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Accept-Ranges": file.headers.get("accept-ranges") ?? "bytes",
    });
    for (const name of ["content-length", "content-range"]) {
      const value = file.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new Response(file.body, { status: file.status, headers });
  } catch {
    return new Response("No encontrado", { status: 404 });
  }
}
