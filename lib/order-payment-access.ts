import "server-only";
import { mapOrderPaymentRequest, type OrderPaymentRequest } from "@/lib/order-payments";
import { getServicePricing } from "@/lib/service-pricing";
import { pbFilterValue } from "@/lib/pocketbase";

type PaidOrder = {
  id: string;
  isCustom?: boolean;
  priceArs?: number;
  priceUsd?: number;
  advancePaymentPercent?: number;
  promotionActive?: boolean;
  promotionPriceArs?: number | null;
  expand?: {
    service?: { priceArs?: number; priceUsd?: number; advancePaymentPercent?: number; promotionActive?: boolean; promotionPriceArs?: number };
  };
};

export async function getApprovedOrderPayments(pb: { collection(name: string): { getFullList(options: Record<string, unknown>): Promise<unknown[]> } }, orderId: string) {
  try {
    const records = await pb.collection("ttmcobuild_order_payments").getFullList({
      filter: `order = ${pbFilterValue(orderId)} && method = "BANK_TRANSFER"`,
      sort: "-createdAt",
    });
    return records.map(mapOrderPaymentRequest);
  } catch {
    return [];
  }
}

export async function getOrderPaymentMap(pb: { collection(name: string): { getFullList(options: Record<string, unknown>): Promise<unknown[]> } }) {
  const result = new Map<string, OrderPaymentRequest[]>();
  try {
    const records = await pb.collection("ttmcobuild_order_payments").getFullList({ filter: 'method = "BANK_TRANSFER"', sort: "-createdAt" });
    for (const raw of records) {
      const payment = mapOrderPaymentRequest(raw);
      const list = result.get(payment.orderId) ?? [];
      list.push(payment);
      result.set(payment.orderId, list);
    }
  } catch {
    return result;
  }
  return result;
}

export function isAdvancePaid(order: PaidOrder, payments: OrderPaymentRequest[]) {
  const approved = payments.filter((payment) => payment.status === "APPROVED" && payment.purpose === "ADVANCE");
  if (order.isCustom) return approved.length > 0;
  const service = order.expand?.service ?? order;
  const percent = service.advancePaymentPercent ?? 100;
  if (percent === 0) return true;
  if (!service || !Number.isInteger(percent) || percent < 0 || percent > 100) return false;
  return approved.some((payment) => {
    if (typeof service.priceArs !== "number" || typeof service.priceUsd !== "number") return false;
    const pricing = getServicePricing({
      priceArs: service.priceArs,
      priceUsd: service.priceUsd,
      promotionActive: Boolean(service.promotionActive),
      promotionPriceArs: service.promotionPriceArs ?? null,
    });
    const total = payment.totalAmount ?? (payment.currency === "ARS" ? pricing.currentArs : pricing.currentUsd);
    const required = Math.round((total * percent / 100 + Number.EPSILON) * 100) / 100;
    return payment.amount >= required;
  });
}
