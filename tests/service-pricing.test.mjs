import assert from "node:assert/strict";
import test from "node:test";
import { getServicePricing } from "../lib/service-pricing.ts";
import { SERVICE_PRICING_DYNAMIC_PATHS, SERVICE_PRICING_STATIC_PATHS } from "../lib/service-pricing-paths.ts";

test("active ARS promotion applies proportional USD discount to cents", () => {
  assert.deepEqual(
    getServicePricing({
      priceArs: 150_000,
      priceUsd: 99.99,
      promotionActive: true,
      promotionPriceArs: 75_000,
    }),
    {
      isPromotional: true,
      regularArs: 150_000,
      currentArs: 75_000,
      regularUsd: 99.99,
      currentUsd: 50,
    },
  );
});

test("inactive or invalid promotions use regular prices", () => {
  for (const promotion of [
    { promotionActive: false, promotionPriceArs: 75_000 },
    { promotionActive: true, promotionPriceArs: 150_000 },
  ]) {
    assert.deepEqual(
      getServicePricing({ priceArs: 150_000, priceUsd: 99.99, ...promotion }),
      {
        isPromotional: false,
        regularArs: 150_000,
        currentArs: 150_000,
        regularUsd: 99.99,
        currentUsd: 99.99,
      },
    );
  }
});

test("service price updates invalidate every list, detail and payment view", () => {
  assert.deepEqual(SERVICE_PRICING_STATIC_PATHS, [
    "/marketplace",
    "/dashboard/marketplace",
    "/dashboard/servicios",
    "/admin/services",
  ]);
  assert.deepEqual(SERVICE_PRICING_DYNAMIC_PATHS, [
    "/marketplace/[id]",
    "/dashboard/marketplace/[id]",
    "/dashboard/chats/[id]",
    "/admin/chats/orders/[id]",
  ]);
});
