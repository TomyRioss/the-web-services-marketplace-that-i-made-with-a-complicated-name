import type { Service } from "@/lib/data-types";
import { getServicePricing } from "@/lib/service-pricing";

const currencyArs = new Intl.NumberFormat("es-AR");

export function ServicePrice({ service, prominent = false }: { service: Service; prominent?: boolean }) {
  const pricing = getServicePricing(service);
  const amountClass = prominent ? "text-2xl" : "text-lg";

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {pricing.isPromotional && (
          <del className="text-sm font-medium text-muted-foreground decoration-[#C9E94F] decoration-2">
            ${currencyArs.format(pricing.regularArs)} ARS
          </del>
        )}
        <span className={`${amountClass} font-semibold tabular-nums ${pricing.isPromotional ? "text-[#C9E94F]" : "text-foreground"}`}>
          ${currencyArs.format(pricing.currentArs)} ARS
        </span>
        {pricing.isPromotional && (
          <span className="font-sans text-xs font-bold text-[#C9E94F]">¡PROMOCIÓN!</span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {pricing.isPromotional && (
          <del className="mr-1 decoration-[#C9E94F] decoration-1">${currencyArs.format(pricing.regularUsd)}</del>
        )}
        ${currencyArs.format(pricing.currentUsd)} USD
      </p>
    </div>
  );
}
