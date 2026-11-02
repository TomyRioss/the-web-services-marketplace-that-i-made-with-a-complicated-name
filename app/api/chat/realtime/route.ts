import "server-only";
import { getChatThread } from "@/app/actions/dashboard";
import { getDirectChatThread } from "@/app/actions/team-chats";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

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

type RealtimeEvent = {
  id?: string;
  event: string;
  data: string;
};

async function* readSseEvents(reader: ReadableStreamDefaultReader<Uint8Array>) {
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) return;
    buffer += decoder.decode(value, { stream: true }).replaceAll("\r\n", "\n");

    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      let id: string | undefined;
      let event = "message";
      const data: string[] = [];
      for (const line of frame.split("\n")) {
        if (line.startsWith("id:")) id = line.slice(3).trim();
        else if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
      }
      if (data.length) yield { id, event, data: data.join("\n") } satisfies RealtimeEvent;
      boundary = buffer.indexOf("\n\n");
    }
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return new Response("No autenticado", { status: 401 });

  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");
  const contactId = url.searchParams.get("contactId");
  if ((!orderId && !contactId) || (orderId && contactId)) {
    return new Response("Chat inválido", { status: 400 });
  }

  try {
    if (orderId) await getChatThread(orderId);
    else await getDirectChatThread(contactId!);
  } catch {
    return new Response("No autorizado", { status: 403 });
  }

  const pocketbaseUrl = process.env.POCKETBASE_URL;
  const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
  const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;
  if (!pocketbaseUrl || !adminEmail || !adminPassword) {
    return new Response("Realtime no disponible", { status: 503 });
  }

  let token: string;
  try {
    const authResponse = await fetch(`${pocketbaseUrl}/api/collections/_superusers/auth-with-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity: adminEmail, password: adminPassword }),
      cache: "no-store",
      signal: request.signal,
    });
    if (!authResponse.ok) throw new Error("PocketBase auth failed");
    const authData = (await authResponse.json()) as { token?: string };
    if (!authData.token) throw new Error("PocketBase auth token missing");
    token = authData.token;
  } catch {
    return new Response("Realtime no disponible", { status: 503 });
  }

  const encoder = new TextEncoder();
  let cancelStream = () => {};
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      let activeReader: ReadableStreamDefaultReader<Uint8Array> | undefined;
      let activeClientId = "";
      const send = (value: string) => {
        if (!closed) controller.enqueue(encoder.encode(value));
      };
      const heartbeat = setInterval(() => send(": keep-alive\n\n"), 25_000);
      const cleanup = async () => {
        if (closed) return;
        closed = true;
        if (heartbeat) clearInterval(heartbeat);
        request.signal.removeEventListener("abort", onAbort);
        await activeReader?.cancel().catch(() => {});
        if (activeClientId) {
          void fetch(`${pocketbaseUrl}/api/realtime`, {
            method: "POST",
            headers: { Authorization: token, "Content-Type": "application/json" },
            body: JSON.stringify({ clientId: activeClientId, subscriptions: [] }),
            cache: "no-store",
          }).catch(() => {});
        }
        try {
          controller.close();
        } catch {
          // The browser may already have closed the stream.
        }
      };
      const onAbort = () => void cleanup();
      cancelStream = onAbort;
      request.signal.addEventListener("abort", onAbort, { once: true });
      send(": connected\n\n");

      while (!closed) {
        activeClientId = "";
        try {
          const pbResponse = await fetch(`${pocketbaseUrl}/api/realtime`, {
            headers: { Accept: "text/event-stream" },
            cache: "no-store",
            signal: request.signal,
          });
          if (!pbResponse.ok || !pbResponse.body) throw new Error("PocketBase realtime connection failed");

          activeReader = pbResponse.body.getReader();
          const events = readSseEvents(activeReader);
          let connected = false;
          while (!closed) {
            const next = await events.next();
            if (next.done) break;
            if (next.value.event === "PB_CONNECT" && next.value.id) {
              activeClientId = next.value.id;
              connected = true;
              break;
            }
          }
          if (closed) break;
          if (!connected) throw new Error("PocketBase did not assign a realtime client id");

          const subscriptionResponse = await fetch(`${pocketbaseUrl}/api/realtime`, {
            method: "POST",
            headers: { Authorization: token, "Content-Type": "application/json" },
            body: JSON.stringify({
              clientId: activeClientId,
              subscriptions: ["ttmcobuild_chat_messages/*"],
            }),
            cache: "no-store",
            signal: request.signal,
          });
          if (!subscriptionResponse.ok) throw new Error("PocketBase realtime subscription failed");

          while (!closed) {
            const next = await events.next();
            if (next.done) break;
            if (next.value.event === "PB_DISCONNECT") break;
            if (next.value.event !== "ttmcobuild_chat_messages/*") continue;

            let payload: { action?: string; record?: ChatRecord };
            try {
              payload = JSON.parse(next.value.data) as { action?: string; record?: ChatRecord };
            } catch {
              continue;
            }
            if (payload.action !== "create" || !payload.record) continue;

            const record = payload.record;
            const authorId = record.author ?? "";
            const matchesChat = orderId
              ? record.order === orderId
              : !record.order && (
                  (authorId === session.userId && record.recipient === contactId) ||
                  (authorId === contactId && record.recipient === session.userId)
                );
            if (!matchesChat) continue;

            let authorName = authorId === session.userId ? "Vos" : "Equipo";
            try {
              const authorResponse = await fetch(
                `${pocketbaseUrl}/api/collections/ttmcobuild_profiles/records/${encodeURIComponent(authorId)}`,
                { headers: { Authorization: token }, cache: "no-store", signal: request.signal }
              );
              if (authorResponse.ok) {
                const author = (await authorResponse.json()) as { fullName?: string; email?: string };
                authorName = author.fullName || author.email || authorName;
              }
            } catch {
              // Keep a generic name if the author profile is unavailable.
            }

            send(`data: ${JSON.stringify({
              id: record.id,
              orderId: record.order ?? "",
              authorName,
              authorRole: record.authorRole ?? "",
              message: record.message ?? "",
              attachments: (record.attachments ?? []).map((name) => ({
                name,
                kind: /\.(jpe?g|png|webp|gif|avif)$/i.test(name) ? "image" : "audio",
                url: `/api/chat/media/${record.id}/${encodeURIComponent(name)}`,
              })),
              createdAt: record.createdAt ?? new Date().toISOString(),
              mine: authorId === session.userId,
            })}\n\n`);
          }
        } catch {
          if (request.signal.aborted) break;
        } finally {
          await activeReader?.cancel().catch(() => {});
          activeReader = undefined;
          activeClientId = "";
        }
        if (!closed) await wait(500);
      }
      if (!closed) await cleanup();
    },
    cancel() {
      cancelStream();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
