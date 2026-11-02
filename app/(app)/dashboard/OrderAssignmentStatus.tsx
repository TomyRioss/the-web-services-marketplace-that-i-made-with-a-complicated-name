import Link from "next/link";
import { ArrowRight, MessageSquare, UserRound, UserRoundSearch } from "lucide-react";

export function OrderAssignmentStatus({
  assignedDevId,
  chatHref,
}: {
  assignedDevId: string;
  chatHref: string;
}) {
  const isAssigned = Boolean(assignedDevId);

  return (
    <section
      aria-label={isAssigned ? "Desarrollador asignado" : "Asignación del desarrollador"}
      className={`flex w-full flex-col gap-3 rounded-xl border px-4 py-3 sm:w-auto sm:min-w-[22rem] sm:flex-row sm:items-center sm:justify-between sm:gap-5 ${
        isAssigned
          ? "border-accent-green/30 bg-accent-green/5"
          : "border-foreground/10 bg-card/40"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          aria-hidden="true"
          className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ${
            isAssigned ? "bg-accent-green/15 text-accent-green" : "bg-foreground/5 text-muted-foreground"
          }`}
        >
          {isAssigned ? <UserRound className="size-4" /> : <UserRoundSearch className="size-4" />}
        </span>
        <div className="min-w-0">
          <p className="font-heading text-[10px] uppercase tracking-wide text-foreground">
            {isAssigned ? "Desarrollador asignado" : "Estamos buscando un desarrollador"}
          </p>
          {isAssigned ? (
            <p className="mt-0.5 text-xs text-muted-foreground">El equipo coordina la conversación y el trabajo.</p>
          ) : (
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              El equipo ya puede ayudarte con este pedido.
            </p>
          )}
        </div>
      </div>
      <Link
          href={chatHref}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-accent-green px-3 py-2 text-sm font-medium text-black transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:min-h-10"
        >
          <MessageSquare aria-hidden="true" className="size-4" />
          <span className="font-heading text-[10px]">Abrir chat</span>
          <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </section>
  );
}
