"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { sendChatMessage, type ChatMessage } from "@/app/actions/dashboard";
import { sendDirectChatMessage } from "@/app/actions/team-chats";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const timeFmt = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" });

function formatTime(date: Date) {
  return timeFmt.format(date).replaceAll("\u00a0", " ");
}

export function ChatThread({
  orderId,
  directUserId,
  backHref = "/dashboard/chats",
  orderTitle,
  statusLabel,
  statusClass,
  initialMessages,
}: {
  orderId?: string;
  directUserId?: string;
  backHref?: string;
  orderTitle: string;
  statusLabel: string;
  statusClass: string;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  useEffect(() => {
    if (!orderId && !directUserId) return;
    const params = new URLSearchParams(
      directUserId ? { contactId: directUserId } : { orderId: orderId! }
    );
    const source = new EventSource(`/api/chat/realtime?${params.toString()}`);
    source.onmessage = (event) => {
      const incoming = JSON.parse(event.data) as Omit<ChatMessage, "createdAt"> & { createdAt: string };
      setMessages((prev) =>
        prev.some((message) => message.id === incoming.id)
          ? prev
          : [...prev, { ...incoming, createdAt: new Date(incoming.createdAt) }]
      );
    };
    return () => source.close();
  }, [orderId, directUserId]);

  function handleSend() {
    const text = draft.trim();
    if (!text || isPending) return;
    setError(null);
    startTransition(async () => {
      try {
        const created = directUserId
          ? await sendDirectChatMessage(directUserId, text)
          : await sendChatMessage(orderId!, text);
        setMessages((prev) => [...prev, created]);
        setDraft("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo enviar el mensaje.");
      }
    });
  }

  return (
    <Card className="flex min-h-0 flex-1 flex-col">
      <CardContent className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div className="min-w-0">
            <Button
              render={<Link href={backHref} />}
              nativeButton={false}
              variant="ghost"
              size="sm"
              className="-ml-2 mb-1 text-muted-foreground"
            >
              <ArrowLeft className="size-4" />
              Chats
            </Button>
            <h1 className="truncate text-lg font-semibold tracking-tight">{orderTitle}</h1>
          </div>
          <Badge className={statusClass}>{statusLabel}</Badge>
        </div>

        <div className="flex max-h-[55vh] min-h-52 flex-1 flex-col gap-2 overflow-y-auto py-4">
          {messages.length === 0 ? (
            <p className="m-auto text-sm text-muted-foreground">
              Todavía no hay mensajes. Contanos algo sobre tu pedido.
            </p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex flex-col gap-0.5", message.mine ? "items-end" : "items-start")}
              >
                {!message.mine && (
                  <span className="px-1 text-[11px] font-medium text-muted-foreground">
                    {message.authorName} · {message.authorRole}
                  </span>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                    message.mine
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-muted text-foreground"
                  )}
                >
                  {message.message}
                </div>
                <span className="px-1 text-[11px] text-muted-foreground">{formatTime(message.createdAt)}</span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex items-end gap-2 border-t pt-4">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Escribí tu mensaje… (Enter para enviar)"
            rows={2}
            aria-label="Mensaje del chat"
          />
          <Button onClick={handleSend} disabled={isPending || !draft.trim()} aria-label="Enviar mensaje">
            <Send className="size-4" />
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
