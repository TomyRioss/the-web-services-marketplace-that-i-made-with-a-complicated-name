"use client";

import { Megaphone } from "lucide-react";
import { usePathname } from "next/navigation";

export function RoutePromoMarquee() {
  const pathname = usePathname();
  const visible = pathname === "/" || pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  if (!visible) return null;

  return (
    <div className="flex min-h-9 shrink-0 items-center gap-3 bg-accent-green px-3 py-1.5 font-sans text-xs font-medium text-black sm:px-6">
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1 text-black">
        <Megaphone aria-hidden="true" className="size-3.5" />
        Oferta Única
      </span>
      <span>50% OFF en todos los servicios hasta el 22/11</span>
    </div>
  );
}
