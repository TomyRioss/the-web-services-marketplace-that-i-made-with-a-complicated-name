"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { DashboardPillNav } from "@/components/DashboardPillNav";

export function DashboardSidebar({
  role,
  fullName,
  email,
}: {
  role: string;
  fullName: string;
  email: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "";
  const items = [
    { href: "/dashboard", label: "Resumen", active: pathname === "/dashboard" },
    ...(role !== "DEV"
      ? [{ href: "/dashboard/servicios", label: "Servicios", active: pathname.startsWith("/dashboard/servicios") }]
      : []),
    {
      href: "/dashboard/orders?tab=progreso",
      label: "En progreso",
      active: pathname === "/dashboard/orders" && (tab === "" || tab === "progreso"),
    },
    {
      href: "/dashboard/orders?tab=hechos",
      label: "Hechos",
      active: pathname === "/dashboard/orders" && tab === "hechos",
    },
    { href: "/dashboard/chats", label: "Chats", active: pathname.startsWith("/dashboard/chats") },
    ...(["OWNER", "ADMIN", "DEV"].includes(role)
      ? [{ href: role === "DEV" ? "/admin/chats" : "/admin/orders", label: "Administración", active: pathname.startsWith("/admin") }]
      : []),
  ];

  return <DashboardPillNav title="Navegación del panel" items={items} marketplace user={{ fullName, email }} role={role} />;
}
