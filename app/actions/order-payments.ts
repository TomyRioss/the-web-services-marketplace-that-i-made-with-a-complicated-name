"use server";

import { getSession } from "@/lib/auth/session";
import type { Role, Service } from "@/lib/data-types";
import {
  mapOrderPaymentRequest,
  parsePaymentAmount,
  revalidateOrderPaymentViews,
  type OrderPaymentRequest,
  type OrderPaymentPurpose,
  type PaymentCurrency,
} from "@/lib/order-payments";
import { ensurePocketBaseAdmin, pbFilterValue } from "@/lib/pocketbase";
import { buildBankTransferMessage } from "@/lib/bank-transfer-message";
import { getServicePricing } from "@/lib/service-pricing";

const PAYMENT_COLLECTION = "ttmcobuild_order_payments";

function formatPaymentAmount(amount: number, currency: PaymentCurrency) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency, currencyDisplay: "code" }).format(amount);
}

async function createOrderChatMessage(
  manager: Awaited<ReturnType<typeof requirePaymentManager>>,
  orderId: string,
  message: string,
  createdAt: string,
): Promise<void> {
  await manager.pb.collection("ttmcobuild_chat_messages").create({
    order: orderId,
    author: manager.userId,
    authorRole: manager.role,
    message,
    createdAt,
    updatedAt: createdAt,
  });
}

type PaymentOrder = {
  id: string;
  status?: string;
  assignedDev?: string;
  isCustom?: boolean;
  expand?: {
    service?: Pick<Service, "title" | "priceArs" | "priceUsd" | "advancePaymentPercent" | "promotionActive" | "promotionPriceArs">;
  };
};

function requireRecordId(id: unknown, message: string): asserts id is string {
  if (typeof id !== "string" || !/^[a-zA-Z0-9]{15}$/.test(id)) throw new Error(message);
}

async function requirePaymentManager() {
  const session = await getSession();
  if (!session) throw new Error("No autenticado.");
  requireRecordId(session.userId, "No autenticado.");

  const pb = await ensurePocketBaseAdmin();
  // Roles can change while the signed session cookie remains valid.
  let role: Role;
  try {
    const profile = await pb.collection("ttmcobuild_profiles").getOne(session.userId, {
      fields: "id,role",
      cache: "no-store",
    });
    role = profile.role;
  } catch {
    throw new Error("No se pudo verificar tu acceso. Volvé a iniciar sesión.");
  }
  if (role !== "ADMIN" && role !== "OWNER") throw new Error("No autorizado.");
  return { pb, userId: session.userId, role };
}

async function getManagedOrder(
  manager: Awaited<ReturnType<typeof requirePaymentManager>>,
  orderId: string,
): Promise<PaymentOrder> {
  requireRecordId(orderId, "Pedido inexistente.");
  let order: PaymentOrder;
  try {
    order = await manager.pb.collection("ttmcobuild_orders").getOne<PaymentOrder>(orderId, {
      expand: "service",
      cache: "no-store",
    });
  } catch {
    throw new Error("No se pudo consultar el pedido. Volvé a intentarlo.");
  }
  return order;
}

function getOrderTotal(order: PaymentOrder, currency: PaymentCurrency, customAmount?: number) {
  if (order.isCustom === true) {
    if (typeof customAmount !== "number") throw new Error("Ingresá el importe acordado para este pedido.");
    return parsePaymentAmount(customAmount);
  }
  const service = order.expand?.service;
  if (!service) throw new Error("El servicio del pedido ya no está disponible.");
  const advancePaymentPercent = service.advancePaymentPercent ?? 100;
  if (!Number.isInteger(advancePaymentPercent) || advancePaymentPercent < 0 || advancePaymentPercent > 100) {
    throw new Error("El porcentaje de anticipo del servicio no es válido.");
  }
  if (advancePaymentPercent === 0) throw new Error("Este servicio no requiere un anticipo.");
  const pricing = getServicePricing(service);
  const total = currency === "ARS" ? pricing.currentArs : pricing.currentUsd;
  return parsePaymentAmount(total);
}

export async function createOrderPaymentRequest(
  orderId: string,
  currency: PaymentCurrency,
  customAmount?: number,
  purpose: OrderPaymentPurpose = "ADVANCE",
): Promise<OrderPaymentRequest> {
  const manager = await requirePaymentManager();
  if (currency !== "ARS" && currency !== "USD") throw new Error("Elegí una moneda válida.");

  const order = await getManagedOrder(manager, orderId);
  const payments = manager.pb.collection(PAYMENT_COLLECTION);
  const paymentRecords = await payments.getFullList({ filter: `order = ${pbFilterValue(order.id)} && method = "BANK_TRANSFER"`, sort: "-createdAt" });
  const previousRequests = paymentRecords.map(mapOrderPaymentRequest);
  const pending = previousRequests.some((request) => request.method === "BANK_TRANSFER" && request.status === "PENDING" && request.purpose === purpose);
  if (pending) throw new Error("Ya hay una transferencia pendiente para esta etapa. Cancelala antes de crear otra.");

  let totalAmount: number;
  let amount: number;
  if (purpose === "ADVANCE") {
    if (previousRequests.some((request) => request.status === "APPROVED" && request.purpose === "ADVANCE")) {
      throw new Error("El anticipo ya fue pagado.");
    }
    totalAmount = getOrderTotal(order, currency, customAmount);
    const advancePercent = order.isCustom === true ? 100 : order.expand?.service?.advancePaymentPercent ?? 100;
    if (!Number.isInteger(advancePercent) || advancePercent < 0 || advancePercent > 100) throw new Error("El porcentaje de anticipo no es válido.");
    if (advancePercent === 0) throw new Error("Este servicio no requiere anticipo.");
    amount = parsePaymentAmount(Math.round((totalAmount * advancePercent / 100 + Number.EPSILON) * 100) / 100);
  } else {
    if (order.status !== "APPROVED" && order.status !== "DONE") throw new Error("El saldo se habilita cuando el cliente aprueba la página.");
    const approvedAdvance = previousRequests.find((request) => request.status === "APPROVED" && request.purpose === "ADVANCE");
    if (!approvedAdvance) throw new Error("Primero debe confirmarse el pago del anticipo.");
    if (currency !== approvedAdvance.currency) throw new Error("El saldo debe solicitarse en la misma moneda que el anticipo.");
    totalAmount = approvedAdvance.totalAmount ?? getOrderTotal(order, currency, approvedAdvance.amount);
    const advancePercent = order.isCustom === true ? 100 : order.expand?.service?.advancePaymentPercent ?? 100;
    const requiredAdvance = Math.round((totalAmount * advancePercent / 100 + Number.EPSILON) * 100) / 100;
    if (approvedAdvance.amount < requiredAdvance) throw new Error("El anticipo todavía no está cubierto.");
    const amountPaid = previousRequests
      .filter((request) => request.status === "APPROVED" && request.currency === currency)
      .reduce((sum, request) => sum + request.amount, 0);
    amount = parsePaymentAmount(Math.round((totalAmount - amountPaid + Number.EPSILON) * 100) / 100);
  }
  const now = new Date().toISOString();
  let request: OrderPaymentRequest;
  try {
    request = mapOrderPaymentRequest(await payments.create({
      order: order.id,
      method: "BANK_TRANSFER",
      amount,
      purpose,
      totalAmount,
      currency,
      status: "PENDING",
      requestedBy: manager.userId,
      createdAt: now,
      updatedAt: now,
    }));
  } catch {
    throw new Error("No se pudo guardar la solicitud de pago. Volvé a intentarlo.");
  }

  try {
    const stage = purpose === "BALANCE" ? "Saldo restante" : "Anticipo";
    await createOrderChatMessage(manager, order.id, `${stage}\n\n${buildBankTransferMessage(request.amount, request.currency)}`, now);
  } catch {
    try {
      await payments.update(request.id, { status: "REJECTED", updatedAt: new Date().toISOString() });
    } catch {
      console.error("No se pudo cerrar una transferencia sin instrucciones enviadas al cliente.");
    }
    revalidateOrderPaymentViews(order.id);
    throw new Error("No se pudieron enviar los datos de transferencia al chat. Volvé a intentarlo.");
  }

  revalidateOrderPaymentViews(order.id);
  return request;
}

export async function confirmBankTransfer(paymentRequestId: string): Promise<void> {
  const manager = await requirePaymentManager();
  requireRecordId(paymentRequestId, "Solicitud de pago inexistente.");
  const payments = manager.pb.collection(PAYMENT_COLLECTION);
  let request: OrderPaymentRequest;
  try {
    request = mapOrderPaymentRequest(await payments.getOne(paymentRequestId, { cache: "no-store" }));
  } catch {
    throw new Error("No se pudo consultar la solicitud de pago. Volvé a intentarlo.");
  }
  await getManagedOrder(manager, request.orderId);
  if (request.method !== "BANK_TRANSFER") throw new Error("Solo se pueden confirmar transferencias bancarias.");
  if (request.status !== "PENDING") throw new Error("La transferencia ya no está pendiente de confirmación.");

  const now = new Date().toISOString();
  try {
    await payments.update(request.id, {
      status: "APPROVED",
      confirmedBy: manager.userId,
      confirmedAt: now,
      updatedAt: now,
    });
  } catch {
    throw new Error("No se pudo confirmar la transferencia. Volvé a intentarlo.");
  }
  revalidateOrderPaymentViews(request.orderId);
}

export async function cancelBankTransfer(paymentRequestId: string): Promise<OrderPaymentRequest> {
  const manager = await requirePaymentManager();
  requireRecordId(paymentRequestId, "Solicitud de pago inexistente.");
  const payments = manager.pb.collection(PAYMENT_COLLECTION);
  let request: OrderPaymentRequest;
  try {
    request = mapOrderPaymentRequest(await payments.getOne(paymentRequestId, { cache: "no-store" }));
  } catch {
    throw new Error("No se pudo consultar la solicitud de transferencia.");
  }
  await getManagedOrder(manager, request.orderId);
  if (request.method !== "BANK_TRANSFER") throw new Error("Solo se pueden cancelar transferencias bancarias.");
  if (request.status !== "PENDING") throw new Error("La transferencia ya no está pendiente.");

  let cancelled: OrderPaymentRequest;
  try {
    cancelled = mapOrderPaymentRequest(await payments.update(request.id, {
      status: "EXPIRED",
      updatedAt: new Date().toISOString(),
    }));
  } catch {
    throw new Error("No se pudo cancelar la transferencia. Volvé a intentarlo.");
  }
  try {
    await createOrderChatMessage(
      manager,
      request.orderId,
      `La solicitud de transferencia fue cancelada: ${formatPaymentAmount(request.amount, request.currency)}. No transfieras ni uses los datos de esta solicitud para pagar.`,
      new Date().toISOString(),
    );
  } catch {
    try {
      await payments.update(request.id, { status: "PENDING", updatedAt: new Date().toISOString() });
    } catch {
      console.error("No se pudo restaurar una transferencia tras fallar el aviso de cancelación.");
    }
    revalidateOrderPaymentViews(request.orderId);
    throw new Error("No se pudo avisar la cancelación en el chat. Volvé a intentarlo.");
  }
  revalidateOrderPaymentViews(request.orderId);
  return cancelled;
}

