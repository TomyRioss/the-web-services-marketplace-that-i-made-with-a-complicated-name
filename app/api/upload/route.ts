import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getSession } from "@/lib/auth/session";

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Iniciá sesión para continuar." }, { status: 401 });
  if (session.role !== "OWNER") return Response.json({ error: "No autorizado." }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Seleccioná una imagen." }, { status: 400 });

  const extension = MIME_EXTENSIONS[file.type];
  if (!extension) return Response.json({ error: "Formato no compatible." }, { status: 400 });
  if (file.size === 0 || file.size > MAX_FILE_SIZE) {
    return Response.json({ error: "La imagen debe pesar hasta 5 MB." }, { status: 400 });
  }

  const filename = `${randomUUID()}${extension}`;
  const uploadDirectory = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(path.join(uploadDirectory, filename), Buffer.from(await file.arrayBuffer()));

  return Response.json({ url: `/uploads/${filename}` });
}
