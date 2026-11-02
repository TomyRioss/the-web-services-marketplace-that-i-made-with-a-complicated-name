import "server-only";
import { revalidatePath } from "next/cache";

export type OrderPaymentMethod = "BANK_TRANSFER";
export type PaymentCurrency = "ARS" | "USD";
export type OrderPaymentStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
export type OrderPaymentPurpose = "ADVANCE" | "BALANCE";

export type OrderPaymentRequest = {
  id: string;
  orderId: string;
  method: OrderPaymentMethod;
  amount: number;
  purpose: OrderPaymentPurpose;
  totalAmount: number | null;
  currency: PaymentCurrency;
  status: OrderPaymentStatus;
  requestedById: string;
  confirmedById: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export function isOrderPaymentMethod(value: unknown): value is OrderPaymentMethod {
  return value === "BANK_TRANSFER";
}

export function isPaymentCurrency(value: unknown): value is PaymentCurrency {
  return value === "ARS" || value === "USD";
}

export function isOrderPaymentStatus(value: unknown): value is OrderPaymentStatus {
  return value === "PENDING" || value === "APPROVED" || value === "REJECTED" || value === "EXPIRED";
}

export function isOrderPaymentPurpose(value: unknown): value is OrderPaymentPurpose {
  return value === "ADVANCE" || value === "BALANCE";
}

export function parsePaymentAmount(value: unknown): number {
  const normalized = typeof value === "string" ? value.trim() : value;
  if (typeof normalized !== "number" && (typeof normalized !== "string" || !/^\d+(?:\.\d+)?$/.test(normalized))) {
    throw new Error("El importe debe ser un número mayor que cero.");
  }
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("El importe debe ser un número mayor que cero.");
  }
  return amount;
}

function recordId(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^[a-zA-Z0-9]{15}$/.test(value)) {
    throw new Error(`La solicitud de pago tiene un campo inválido: ${field}.`);
  }
  return value;
}

function optionalString(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.trim() !== value || !value) {
    throw new Error(`La solicitud de pago tiene un campo inválido: ${field}.`);
  }
  return value;
}

function dateString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`La solicitud de pago tiene una fecha inválida: ${field}.`);
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new Error(`La solicitud de pago tiene una fecha inválida: ${field}.`);
  }
  return date.toISOString();
}

export function mapOrderPaymentRequest(raw: unknown): OrderPaymentRequest {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("La solicitud de pago no es válida.");
  }
  const record = raw as Record<string, unknown>;
  if (!isOrderPaymentMethod(record.method) || !isPaymentCurrency(record.currency) || !isOrderPaymentStatus(record.status)) {
    throw new Error("La solicitud de pago tiene un método, moneda o estado inválido.");
  }
  const confirmedBy = optionalString(record.confirmedBy, "confirmedBy");
  const confirmedAt = optionalString(record.confirmedAt, "confirmedAt");

  return {
    id: recordId(record.id, "id"),
    orderId: recordId(record.order, "order"),
    method: record.method,
    amount: parsePaymentAmount(record.amount),
    purpose: record.purpose === undefined || record.purpose === null || record.purpose === ""
      ? "ADVANCE"
      : isOrderPaymentPurpose(record.purpose) ? record.purpose : (() => { throw new Error("El tipo de pago no es válido."); })(),
    totalAmount: typeof record.totalAmount === "number" && Number.isFinite(record.totalAmount) && record.totalAmount > 0 ? record.totalAmount : null,
    currency: record.currency,
    status: record.status,
    requestedById: recordId(record.requestedBy, "requestedBy"),
    confirmedById: confirmedBy ? recordId(confirmedBy, "confirmedBy") : null,
    confirmedAt: confirmedAt ? dateString(confirmedAt, "confirmedAt") : null,
    createdAt: dateString(record.createdAt, "createdAt"),
    updatedAt: dateString(record.updatedAt, "updatedAt"),
  };
}
export function revalidateOrderPaymentViews(orderId: string) {
  recordId(orderId, "order");
  revalidatePath(`/dashboard/chats/${orderId}`);
  revalidatePath(`/admin/chats/orders/${orderId}`);
  revalidatePath("/dashboard/chats");
  revalidatePath("/admin/chats");
  revalidatePath("/dashboard/orders");
  revalidatePath("/admin/orders");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/staff");
}
