"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { cancelBankTransfer, confirmBankTransfer, createOrderPaymentRequest } from "@/app/actions/order-payments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OrderPaymentPurpose, OrderPaymentRequest, PaymentCurrency } from "@/lib/order-payments";
import { isPaymentRequestVisible } from "@/lib/order-payment-visibility";
import { getServicePricing } from "@/lib/service-pricing";
import type { Service } from "@/lib/data-types";

type PaymentService = Pick<Service, "priceArs" | "priceUsd" | "promotionActive" | "promotionPriceArs">;

export type OrderPaymentPanelProps = {
  orderId: string;
  orderStatus: string;
  role: string;
  isCustom: boolean;
  servicePriceArs: number;
  servicePriceUsd: number;
  advancePaymentPercent?: number;
  promotionActive?: boolean;
  promotionPriceArs?: number | null;
  requests: OrderPaymentRequest[];
  requestsError: string | null;
};

const STATUS_LABELS = {
  PENDING: "Pendiente",
  APPROVED: "Pago confirmado",
  REJECTED: "Rechazado",
  EXPIRED: "Cancelado",
} as const;

function money(amount: number, currency: PaymentCurrency) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 20,
  }).format(amount);
}

export function OrderPaymentPanel({ orderId, orderStatus, role, isCustom, servicePriceArs, servicePriceUsd, advancePaymentPercent = 100, promotionActive, promotionPriceArs, requests, requestsError }: OrderPaymentPanelProps) {
  const router = useRouter();
  const formId = useId();
  const [updates, setUpdates] = useState<OrderPaymentRequest[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [currency, setCurrency] = useState<PaymentCurrency>("ARS");
  const [customAmount, setCustomAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const canManage = role === "ADMIN" || role === "OWNER";
  const pricing = getServicePricing({ priceArs: servicePriceArs, priceUsd: servicePriceUsd, promotionActive: Boolean(promotionActive), promotionPriceArs: promotionPriceArs ?? null } satisfies PaymentService);
  const approvedAdvance = requests.find((request) => request.purpose === "ADVANCE" && request.status === "APPROVED");
  const paymentPurpose: OrderPaymentPurpose | null = approvedAdvance
    ? orderStatus === "APPROVED" || orderStatus === "DONE" ? "BALANCE" : null
    : "ADVANCE";
  const effectiveCurrency = paymentPurpose === "BALANCE" && approvedAdvance ? approvedAdvance.currency : currency;
  const estimatedTotal = paymentPurpose === "BALANCE" && approvedAdvance?.totalAmount
    ? approvedAdvance.totalAmount
    : effectiveCurrency === "ARS" ? pricing.currentArs : pricing.currentUsd;
  const approvedAmount = requests
    .filter((request) => request.status === "APPROVED" && request.currency === effectiveCurrency)
    .reduce((sum, request) => sum + request.amount, 0);
  const normalizedAmount = customAmount.trim().replace(",", ".");
  const validCustomAmount = /^\d+(?:\.\d+)?$/.test(normalizedAmount) && Number.isFinite(Number(normalizedAmount)) && Number(normalizedAmount) > 0;
  const amount = paymentPurpose === "BALANCE"
    ? Math.max(0, Math.round((estimatedTotal - approvedAmount + Number.EPSILON) * 100) / 100)
    : isCustom
      ? (validCustomAmount ? Number(normalizedAmount) * advancePaymentPercent / 100 : null)
      : (effectiveCurrency === "ARS" ? pricing.currentArs : pricing.currentUsd) * advancePaymentPercent / 100;
  const visibleRequests = new Map<string, OrderPaymentRequest>();
  for (const request of [...requests, ...updates]) {
    if (request.orderId !== orderId || request.method !== "BANK_TRANSFER") continue;
    const previous = visibleRequests.get(request.id);
    if (!previous || request.updatedAt >= previous.updatedAt) visibleRequests.set(request.id, request);
  }
  const paymentRequests = [...visibleRequests.values()]
    .filter((request) => isPaymentRequestVisible(request.status))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function createRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage || !amount || !Number.isFinite(amount) || amount <= 0 || isPending || requestsError) return;
    setError(null);
    setNotice("");
    startTransition(async () => {
      try {
        if (!paymentPurpose) throw new Error("Todavía no se puede solicitar otro pago.");
        const created = await createOrderPaymentRequest(orderId, effectiveCurrency, isCustom ? Number(normalizedAmount) : undefined, paymentPurpose);
        setUpdates((previous) => [...previous.filter((request) => request.id !== created.id), created]);
        setFormOpen(false);
        setCustomAmount("");
        setNotice("Datos de transferencia enviados al chat del cliente.");
        router.refresh();
      } catch (failure) {
        setError(failure instanceof Error ? failure.message : "No se pudo enviar la transferencia.");
      }
    });
  }

  function updateRequest(request: OrderPaymentRequest, action: "confirm" | "cancel") {
    if (!canManage || isPending) return;
    setError(null);
    setNotice("");
    setBusyId(request.id);
    startTransition(async () => {
      try {
        if (action === "confirm") await confirmBankTransfer(request.id);
        else await cancelBankTransfer(request.id);
        const updated = { ...request, status: action === "confirm" ? "APPROVED" as const : "EXPIRED" as const, updatedAt: new Date().toISOString() };
        setUpdates((previous) => [...previous.filter((item) => item.id !== request.id), updated]);
        setNotice(action === "confirm" ? "Pago confirmado." : "Transferencia cancelada.");
        router.refresh();
      } catch (failure) {
        setError(failure instanceof Error ? failure.message : "No se pudo actualizar el pago.");
      } finally {
        setBusyId(null);
      }
    });
  }

  return (
    <section aria-labelledby={`${formId}-heading`} className="border-b py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={`${formId}-heading`} className="font-heading text-xs leading-6">Pago por transferencia</h2>
        {canManage && paymentPurpose && <Button type="button" variant="outline" className="min-h-10 font-heading text-xs" disabled={isPending || Boolean(requestsError) || (!isCustom && advancePaymentPercent === 0) || (paymentPurpose === "BALANCE" && amount === 0)} aria-expanded={formOpen} aria-controls={`${formId}-form`} onClick={() => setFormOpen((open) => !open)}>{formOpen ? "Cerrar" : paymentPurpose === "BALANCE" ? "Solicitar pago restante" : "Solicitar transferencia"}</Button>}
      </div>
      {canManage && !isCustom && advancePaymentPercent === 0 && <p className="mt-2 text-sm text-muted-foreground">Este servicio no requiere anticipo.</p>}

      {canManage && formOpen && (
        <form id={`${formId}-form`} onSubmit={createRequest} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${formId}-currency`} className="mb-1.5 block text-sm">Moneda de transferencia</label>
              <select id={`${formId}-currency`} value={effectiveCurrency} disabled={paymentPurpose === "BALANCE"} onChange={(event) => setCurrency(event.target.value as PaymentCurrency)} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="ARS">ARS · Pesos argentinos</option>
                <option value="USD">USD · Dólares</option>
              </select>
              <p className="mt-1.5 text-xs text-muted-foreground">{currency === "ARS" ? "Alias tomyrios.mp, CVU 0000003100068327389046." : "Lead Bank, cuenta y routing en USD."}</p>
            </div>
            {isCustom && <div>
              <label htmlFor={`${formId}-amount`} className="mb-1.5 block text-sm">Importe acordado en {currency}</label>
              <Input id={`${formId}-amount`} type="text" inputMode="decimal" required value={customAmount} onChange={(event) => setCustomAmount(event.target.value)} placeholder="Ej. 1500,50" className="h-11" aria-invalid={customAmount.length > 0 && !validCustomAmount} />
            </div>}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted px-3 py-3">
            <div aria-live="polite" aria-atomic="true">
              <p className="text-xs text-muted-foreground">{paymentPurpose === "BALANCE" ? "Saldo restante" : isCustom ? "Total acordado" : `Anticipo (${advancePaymentPercent}%)`}{!isCustom && pricing.isPromotional ? " con promoción" : ""}</p>
              <p className="mt-1 break-all text-lg font-semibold tabular-nums">{!isCustom && advancePaymentPercent === 0 ? "No requiere anticipo" : amount ? money(amount, currency) : "Ingresá un importe válido"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={!amount || amount <= 0 || isPending || Boolean(requestsError)} className="min-h-11 bg-accent-green px-4 font-heading text-xs text-background hover:bg-accent-green/90">{isPending ? "Enviando…" : "Enviar datos de transferencia"}</Button>
              <Button type="button" variant="ghost" disabled={isPending} onClick={() => setFormOpen(false)} className="min-h-11">Cancelar</Button>
            </div>
          </div>
        </form>
      )}

      {requestsError && <p role="alert" className="mt-3 text-sm text-destructive">{requestsError}</p>}
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="mt-3 text-sm text-accent-green">{notice}</p>}
      {paymentRequests.length === 0 && !requestsError ? <p className="mt-2 text-sm text-muted-foreground">{canManage ? "Todavía no enviaste los datos para transferir." : "El equipo todavía no envió los datos para transferir."}</p> : paymentRequests.length > 0 && (
        <ol aria-label="Transferencias del pedido, más recientes primero" className="mt-3 space-y-4">
          {paymentRequests.map((request) => (
            <li key={request.id} className="border-t pt-3 first:border-t-0 first:pt-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium">Transferencia bancaria · {request.purpose === "BALANCE" ? "Saldo" : "Anticipo"}</h3>
                  <p className="mt-1 break-all text-lg font-semibold tabular-nums">{money(request.amount, request.currency)}</p>
                  <time dateTime={request.createdAt} suppressHydrationWarning className="text-xs text-muted-foreground">{new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date(request.createdAt))}</time>
                </div>
                <p className={`rounded-sm text-sm ${request.status === "APPROVED" ? "text-accent-green" : "text-muted-foreground"}`}>{STATUS_LABELS[request.status]}</p>
              </div>
              {canManage && request.status === "PENDING" && <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" disabled={isPending} onClick={() => updateRequest(request, "confirm")} className="min-h-10 font-heading text-xs">{busyId === request.id ? "Guardando…" : "Confirmar pago"}</Button>
                <Button type="button" variant="ghost" disabled={isPending} onClick={() => updateRequest(request, "cancel")} className="min-h-10">Cancelar transferencia</Button>
              </div>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
