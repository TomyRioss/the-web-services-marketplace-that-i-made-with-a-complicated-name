"use client";

import { usePathname } from "next/navigation";
import { FaWhatsapp } from "react-icons/fa";

export function WhatsAppSupport() {
  const pathname = usePathname();
  const isDashboard =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  if (isDashboard) return null;

  return (
    <a
      href="https://wa.me/5491171410652"
      target="_blank"
      rel="noreferrer"
      aria-label="Contactar soporte por WhatsApp"
      className="fixed bottom-5 right-5 z-[60] inline-flex items-center gap-1 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:bottom-6 sm:right-6"
    >
      <span
        aria-hidden="true"
        className="relative rounded-lg border border-white/10 bg-[#222] px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-black/30 after:absolute after:-right-1.5 after:bottom-2 after:border-y-[6px] after:border-y-transparent after:border-l-[7px] after:border-l-[#222]"
      >
        Soporte
      </span>
      <span
        aria-hidden="true"
        className="grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/35 transition-transform duration-200 hover:scale-105"
      >
        <FaWhatsapp aria-hidden="true" size={30} />
      </span>
    </a>
  );
}
