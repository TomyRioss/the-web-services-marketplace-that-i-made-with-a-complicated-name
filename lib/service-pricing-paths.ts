export const SERVICE_PRICING_STATIC_PATHS = [
  "/marketplace",
  "/dashboard/marketplace",
  "/dashboard/servicios",
  "/admin/services",
] as const;

export const SERVICE_PRICING_DYNAMIC_PATHS = [
  "/marketplace/[id]",
  "/dashboard/marketplace/[id]",
  "/dashboard/chats/[id]",
  "/admin/chats/orders/[id]",
] as const;
