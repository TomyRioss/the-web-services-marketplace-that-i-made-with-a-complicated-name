migrate((app) => {
  const profiles = new Collection({
    type: "base",
    name: "ttmcobuild_profiles",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: "legacyId", type: "text", max: 64 },
      { name: "email", type: "text", required: true, min: 3, max: 254 },
      { name: "passwordHash", type: "text", required: true, max: 255 },
      { name: "fullName", type: "text", max: 200 },
      { name: "phone", type: "text", max: 64 },
      { name: "role", type: "select", required: true, maxSelect: 1, values: ["CLIENTE", "DEV", "ADMIN", "OWNER"] },
      { name: "createdAt", type: "date", required: true },
      { name: "updatedAt", type: "date", required: true },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_ttmcobuild_profiles_email ON ttmcobuild_profiles (email COLLATE NOCASE)",
      "CREATE UNIQUE INDEX idx_ttmcobuild_profiles_legacy_id ON ttmcobuild_profiles (legacyId) WHERE legacyId != ''",
    ],
  });
  app.save(profiles);

  const services = new Collection({
    type: "base",
    name: "ttmcobuild_services",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: "legacyId", type: "text", max: 64 },
      { name: "title", type: "text", required: true, max: 200 },
      { name: "description", type: "text", required: true, max: 20000 },
      { name: "priceArs", type: "number", required: true },
      { name: "priceUsd", type: "number", required: true },
      { name: "deliveryDays", type: "number", required: true },
      { name: "portfolioUrls", type: "json" },
      { name: "references", type: "json" },
      { name: "active", type: "bool", required: true },
      { name: "createdAt", type: "date", required: true },
      { name: "updatedAt", type: "date", required: true },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_ttmcobuild_services_legacy_id ON ttmcobuild_services (legacyId) WHERE legacyId != ''"],
  });
  app.save(services);

  const orders = new Collection({
    type: "base",
    name: "ttmcobuild_orders",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: "legacyId", type: "text", max: 64 },
      { name: "service", type: "relation", required: true, maxSelect: 1, collectionId: services.id, cascadeDelete: false },
      { name: "client", type: "relation", required: true, maxSelect: 1, collectionId: profiles.id, cascadeDelete: false },
      { name: "message", type: "text", required: true, max: 20000 },
      { name: "status", type: "select", required: true, maxSelect: 1, values: ["PENDING", "IN_PROGRESS", "DONE", "CANCELLED"] },
      { name: "createdAt", type: "date", required: true },
      { name: "updatedAt", type: "date", required: true },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_ttmcobuild_orders_legacy_id ON ttmcobuild_orders (legacyId) WHERE legacyId != ''"],
  });
  app.save(orders);
}, (app) => {
  for (const name of ["ttmcobuild_orders", "ttmcobuild_services", "ttmcobuild_profiles"]) {
    try {
      app.delete(app.findCollectionByNameOrId(name));
    } catch {
      // The collection may not have been created yet.
    }
  }
});
