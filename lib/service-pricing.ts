import type { Service } from "@/lib/data-types";

export function getServicePricing(service: Pick<Service, "priceArs" | "priceUsd" | "promotionActive" | "promotionPriceArs">) {
  const isPromotional = Boolean(
    service.promotionActive &&
      service.promotionPriceArs &&
      service.promotionPriceArs > 0 &&
      service.promotionPriceArs < service.priceArs
  );

  return {
    isPromotional,
    regularArs: service.priceArs,
    currentArs: isPromotional ? service.promotionPriceArs! : service.priceArs,
    regularUsd: service.priceUsd,
    currentUsd: isPromotional && service.priceArs > 0
      ? Math.round((service.priceUsd * (service.promotionPriceArs! / service.priceArs) + Number.EPSILON) * 100) / 100
      : service.priceUsd,
  };
}
