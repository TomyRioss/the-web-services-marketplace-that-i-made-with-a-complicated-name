import type { OrderPaymentMethod, OrderPaymentStatus } from "@/lib/order-payments";

export function isPaymentRequestVisible(status: OrderPaymentStatus) {
  return status === "PENDING" || status === "APPROVED";
}

export function getPendingTransfersToSupersede<T extends { id: string; method: OrderPaymentMethod; status: OrderPaymentStatus }>(
  requests: T[],
  keepId: string,
) {
  return requests.filter((request) => request.id !== keepId && request.method === "BANK_TRANSFER" && request.status === "PENDING");
}
