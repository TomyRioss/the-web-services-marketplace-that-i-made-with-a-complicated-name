"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mic, Paperclip, Send, Square, X } from "lucide-react";
import { sendChatMessage, type ChatMessage } from "@/app/actions/dashboard";
import { sendDirectChatMessage } from "@/app/actions/team-chats";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CommunicationPreference } from "@/lib/data-types";
import { COMMUNICATION_PREFERENCE_LABELS } from "@/lib/order-preferences";
import { OrderPaymentPanel, type OrderPaymentPanelProps } from "./OrderPaymentPanel";
import { OrderDeliveryPanel, type OrderDeliveryPanelProps } from "./OrderDeliveryPanel";
import { OrderReviewPanel } from "./OrderReviewPanel";
import { OrderClosePanel } from "./OrderClosePanel";

const timeFmt = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" });

function formatTime(date: Date) {
  return timeFmt.format(date).replaceAll("\u00a0", " ");
}

function appendMessageOnce(messages: ChatMessage[], incoming: ChatMessage) {
  return messages.some((message) => message.id === incoming.id) ? messages : [...messages, incoming];
}

function uniqueMessages(messages: ChatMessage[]) {
  const seen = new Set<string>();
  return messages.filter((message) => {
    if (seen.has(message.id)) return false;
    seen.add(message.id);
    return true;
  });
}

function renderMessageText(value: string) {
  return value.split(/(https?:\/\/[^\s]+|\/api\/orders\/[^\s]+)/g).map((part, index) => {
    if (!/^https?:\/\/|^\/api\/orders\//.test(part)) return part;
    return <a key={`${index}-${part}`} href={part} target="_blank" rel="noreferrer" className="underline underline-offset-2">{part}</a>;
  });
}

export function ChatThread({
  orderId,
  directUserId,
  backHref = "/dashboard/chats",
  orderTitle,
  statusLabel,
  statusClass,
  communicationPreference,
  sessionRole,
  initialMessages,
  paymentPanel,
  reviewPanel,
  closePanel,
  deliveryPanel,
}: {
  orderId?: string;
  directUserId?: string;
  backHref?: string;
  orderTitle: string;
  statusLabel: string;
  statusClass: string;
  communicationPreference?: CommunicationPreference | null;
  sessionRole?: string;
  initialMessages: ChatMessage[];
  paymentPanel?: Omit<OrderPaymentPanelProps, "orderId">;
  reviewPanel?: { previewUrl: string | null; approved: boolean; closed: boolean } | null;
  closePanel?: boolean;
  deliveryPanel?: Omit<OrderDeliveryPanelProps, "orderId"> | null;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(() => uniqueMessages(initialMessages));
  const [draft, setDraft] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [recordedAudio, setRecordedAudio] = useState<File | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const discardRecordingRef = useRef(false);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clientMode = sessionRole === "CLIENTE" && Boolean(orderId);
  const canSend = Boolean(draft.trim() || selectedFiles.length || recordedAudio) && !isPending && !isRecording;

  useEffect(() => () => {
    if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
  }, [recordedAudioUrl]);

  useEffect(() => () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    discardRecordingRef.current = true;
    recorderRef.current?.stop();
    recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

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
      setMessages((prev) => appendMessageOnce(prev, { ...incoming, createdAt: new Date(incoming.createdAt) }));
      if (incoming.message.startsWith("La solicitud de transferencia fue cancelada:")) router.refresh();
    };
    return () => source.close();
  }, [orderId, directUserId, router]);

  function handleSend() {
    const text = draft.trim();
    const filesToSend = recordedAudio ? [...selectedFiles, recordedAudio] : selectedFiles;
    if ((!text && !filesToSend.length) || isPending || isRecording) return;
    setError(null);
    startTransition(async () => {
      try {
        let created: ChatMessage;
        if (filesToSend.length) {
          const form = new FormData();
          if (directUserId) form.set("contactId", directUserId);
          else form.set("orderId", orderId!);
          form.set("message", text);
          filesToSend.forEach((file) => form.append("attachments", file));
          const response = await fetch("/api/chat/media", { method: "POST", body: form });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "No se pudo enviar el archivo.");
          created = { ...result, createdAt: new Date(result.createdAt) } as ChatMessage;
        } else {
          created = directUserId
            ? await sendDirectChatMessage(directUserId, text)
            : await sendChatMessage(orderId!, text);
        }
        setMessages((prev) => appendMessageOnce(prev, created));
        setDraft("");
        setSelectedFiles([]);
        setRecordedAudio(null);
        setRecordingSeconds(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo enviar el mensaje.");
      }
    });
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Este navegador no permite grabar audio.");
      return;
    }
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      recordingChunksRef.current = [];
      discardRecordingRef.current = false;
      const mimeType = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"]
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) recordingChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || "audio/webm";
        if (!discardRecordingRef.current) {
          const extension = type.includes("ogg") ? "ogg" : type.includes("mp4") ? "m4a" : "webm";
          const recording = new File(recordingChunksRef.current, `nota-de-voz.${extension}`, { type: type.split(";")[0] });
          if (recording.size) {
            setRecordedAudioUrl(URL.createObjectURL(recording));
            setRecordedAudio(recording);
          }
        }
        stream.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        recorderRef.current = null;
        recordingChunksRef.current = [];
        setIsRecording(false);
      };
      recorder.start();
      setRecordingSeconds(0);
      setIsRecording(true);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds((seconds) => seconds + 1), 1000);
    } catch {
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
      setError("No se pudo acceder al micrófono. Revisá el permiso del navegador.");
    }
  }

  function stopRecording(discard = false) {
    discardRecordingRef.current = discard;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = null;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    else {
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
      setIsRecording(false);
    }
  }

  function formatRecordingTime(seconds: number) {
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
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
            {orderId && (
              <p className="mt-1 text-xs text-muted-foreground">
                ID del chat: <span className="font-mono tabular-nums">{orderId}</span>
              </p>
            )}
            {communicationPreference && (
              <p className="mt-1 text-xs text-accent-green">
                Preferencia: {COMMUNICATION_PREFERENCE_LABELS[communicationPreference]}
              </p>
            )}
          </div>
          <Badge className={statusClass}>{statusLabel}</Badge>
        </div>

        {orderId && reviewPanel && <OrderReviewPanel orderId={orderId} {...reviewPanel} />}
        {orderId && closePanel && <OrderClosePanel orderId={orderId} />}
        {orderId && paymentPanel && <OrderPaymentPanel key={orderId} orderId={orderId} {...paymentPanel} />}
        {orderId && deliveryPanel && <OrderDeliveryPanel orderId={orderId} {...deliveryPanel} />}

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
                {message.message !== "Archivo adjunto" && (message.message || !message.attachments?.length) && (
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                      message.mine
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-muted text-foreground"
                    )}
                  >
                    {renderMessageText(message.message)}
                  </div>
                )}
                {message.attachments?.map((attachment) => (
                  <div key={attachment.url} className="max-w-[85%] overflow-hidden rounded-xl border bg-background p-1">
                    {attachment.kind === "image" ? (
                      <a href={attachment.url} target="_blank" rel="noreferrer" aria-label={`Abrir ${attachment.name}`}>
                        <Image src={attachment.url} alt={attachment.name} width={480} height={360} unoptimized className="max-h-72 w-auto max-w-full rounded-lg object-contain" />
                      </a>
                    ) : (
                      <audio controls preload="metadata" src={attachment.url} className="max-w-full" aria-label={`Audio: ${attachment.name}`} />
                    )}
                  </div>
                ))}
                <span className="px-1 text-[11px] text-muted-foreground">{formatTime(message.createdAt)}</span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex items-end gap-2 pt-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={clientMode ? "image/jpeg,image/png,image/webp,image/gif,image/avif" : "image/jpeg,image/png,image/webp,image/gif,image/avif,audio/mpeg,audio/mp4,audio/ogg,audio/wav,audio/webm,audio/aac,audio/x-m4a"}
            multiple
            className="sr-only"
            aria-label={clientMode ? "Adjuntar comprobante como imagen" : "Adjuntar imágenes o audios"}
            onChange={(event) => {
              const files = Array.from(event.currentTarget.files ?? []);
              if (files.length > 5) {
                setError("Podés adjuntar hasta 5 archivos por mensaje.");
                event.currentTarget.value = "";
                return;
              }
              if (clientMode && files.some((file) => !file.type.startsWith("image/"))) {
                setError("El comprobante debe ser una imagen.");
                event.currentTarget.value = "";
                return;
              }
              setError(null);
              setSelectedFiles(files);
            }}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isPending} aria-label={clientMode ? "Adjuntar comprobante" : "Adjuntar imágenes o audios"}>
            <Paperclip className="size-4" />
          </Button>
          {clientMode ? null : isRecording ? (
            <Button variant="destructive" onClick={() => stopRecording()} aria-label="Detener grabación">
              <Square className="size-4 fill-current" />
            </Button>
          ) : (
            <Button variant="outline" onClick={() => void startRecording()} disabled={isPending || Boolean(recordedAudio)} aria-label="Grabar audio">
              <Mic className="size-4" />
            </Button>
          )}
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
          <Button
            onClick={handleSend}
            disabled={!canSend}
            aria-label={selectedFiles.length || recordedAudio ? "Enviar mensaje con archivo adjunto" : "Enviar mensaje"}
            className={canSend ? "bg-accent-green text-black hover:bg-[#d7f46b]" : undefined}
          >
            <Send className="size-4" />
          </Button>
        </div>
        {selectedFiles.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2" aria-label="Archivos adjuntos">
            {selectedFiles.map((file, index) => (
              <span key={`${file.name}-${file.lastModified}`} className="flex max-w-full items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
                <span className="max-w-56 truncate">{file.name}</span>
                <button type="button" onClick={() => setSelectedFiles((current) => current.filter((_, i) => i !== index))} aria-label={`Quitar ${file.name}`}>
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
            {!draft.trim() && selectedFiles.every((file) => file.type.startsWith("image/")) && (
              <span className="text-xs text-accent-green" role="status">Lista para enviar sin texto</span>
            )}
          </div>
        )}
        {isRecording && (
          <div className="mt-2 flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm" role="status" aria-live="polite">
            <span className="flex items-center gap-2 text-destructive"><span className="size-2 animate-pulse rounded-full bg-destructive" />Grabando audio</span>
            <span className="font-mono tabular-nums">{formatRecordingTime(recordingSeconds)}</span>
            <button type="button" onClick={() => stopRecording(true)} className="text-muted-foreground hover:text-foreground" aria-label="Cancelar grabación"><X className="size-4" /></button>
          </div>
        )}
        {recordedAudio && recordedAudioUrl && (
          <div className="mt-2 flex items-center gap-2 rounded-lg border px-3 py-2">
            <audio controls src={recordedAudioUrl} className="min-w-0 flex-1" aria-label="Escuchar nota de voz antes de enviar" />
            <button type="button" onClick={() => setRecordedAudio(null)} className="text-muted-foreground hover:text-foreground" aria-label="Descartar nota de voz"><X className="size-4" /></button>
          </div>
        )}
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
