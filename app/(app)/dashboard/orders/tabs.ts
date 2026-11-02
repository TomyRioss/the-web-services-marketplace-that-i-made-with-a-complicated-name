import type { OrdersTab } from "@/app/actions/dashboard";

export const TABS: { id: OrdersTab; label: string }[] = [
  { id: "progreso", label: "Activos" },
  { id: "hechos", label: "Hechos" },
  { id: "cancelados", label: "Cancelados" },
  { id: "todos", label: "Todos" },
];

export function isOrdersTab(value: string | undefined): value is OrdersTab {
  return value === "progreso" || value === "hechos" || value === "cancelados" || value === "todos";
}
