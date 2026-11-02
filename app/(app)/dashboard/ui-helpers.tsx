import type { OrderStatus } from "@/lib/data-types";

export const STATUS_META: Record<OrderStatus, { label: string; className: string }> = {
  PENDING: { label: "Recibido", className: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  IN_PROGRESS: { label: "En progreso", className: "bg-sky-500/15 text-sky-700 border-sky-500/30" },
  REVIEW: { label: "En revisión", className: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  APPROVED: { label: "Aprobado por el cliente", className: "bg-accent-green/15 text-accent-green border-accent-green/30" },
  DONE: { label: "Terminado", className: "bg-accent-green/15 text-accent-green border-accent-green/30" },
  CANCELLED: { label: "Cancelado", className: "bg-muted text-muted-foreground border-foreground/10" },
};

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}
