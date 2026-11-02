migrate((app) => {
  try {
    app.findCollectionByNameOrId("ttmcobuild_dashboard_ads");
    return;
  } catch {
    // Create the dashboard ad collection below.
  }

  const ads = new Collection({
    type: "base",
    name: "ttmcobuild_dashboard_ads",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: "slot", type: "text", required: true, max: 32 },
      { name: "image", type: "file", maxSelect: 1, maxSize: 5242880, mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"] },
      { name: "imageUrl", type: "text", max: 2048 },
      { name: "href", type: "text", required: true, max: 2048 },
      { name: "active", type: "bool" },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_ttmcobuild_dashboard_ads_slot ON ttmcobuild_dashboard_ads (slot)",
    ],
  });
  app.save(ads);

  app.save(new Record(ads, {
    slot: "home",
    imageUrl: "/images/devta-anuncio.png",
    href: "/dashboard/marketplace/programacion-web",
    active: true,
  }));
}, (app) => {
  try {
    app.delete(app.findCollectionByNameOrId("ttmcobuild_dashboard_ads"));
  } catch {
    // The collection may not have been created yet.
  }
});
