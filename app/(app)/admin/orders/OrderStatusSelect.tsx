"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateOrderStatus } from "@/app/actions/marketplace";
import type { OrderStatus } from "@/lib/data-types";

const statusLabel: Record<OrderStatus, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En progreso",
  DONE: "Terminado",
  CANCELLED: "Cancelado",
};

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={status}
      disabled={isPending}
      onValueChange={(value) => {
        startTransition(async () => {
          await updateOrderStatus(orderId, value as OrderStatus);
        });
      }}
    >
      <SelectTrigger size="sm">
        <SelectValue>{(value: OrderStatus) => statusLabel[value]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(statusLabel).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
