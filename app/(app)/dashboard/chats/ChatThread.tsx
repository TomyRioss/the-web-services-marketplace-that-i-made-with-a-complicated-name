"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { getChatThread, sendChatMessage, type ChatMessage } from "@/app/actions/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const timeFmt = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" });

export function ChatThread({
  orderId,
  orderTitle,
  statusLabel,
  statusClass,
  initialMessages,
}: {
  orderId: string;
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
  const paused = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (paused.current || draft.trim()) return;
      startTransition(async () => {
        try {
          const thread = await getChatThread(orderId);
          setMessages((prev) => (prev.length === thread.messages.length ? prev : thread.messages));
        } catch {
          // The connection can blink; keep what we have and try again on the next tick.
        }
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [orderId, draft]);

  function handleSend() {
    const text = draft.trim();
    if (!text || isPending) return;
    setError(null);
    paused.current = true;
    startTransition(async () => {
      try {
        const created = await sendChatMessage(orderId, text);
        setMessages((prev) => [...prev, created]);
        setDraft("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo enviar el mensaje.");
      } finally {
        paused.current = false;
      }
    });
  }

  return (
    <Card className="flex min-h-0 flex-1 flex-col">
      <CardContent className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div className="min-w-0">
            <Button
              render={<Link href="/dashboard/chats" />}
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
                <span className="px-1 text-[11px] text-muted-foreground">{timeFmt.format(message.createdAt)}</span>
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
