migrate((app) => {
  const ads = app.findCollectionByNameOrId("ttmcobuild_dashboard_ads");
  try {
    app.findFirstRecordByFilter(ads, 'slot = "launch"');
    return;
  } catch {
    app.save(new Record(ads, {
      slot: "launch",
      imageUrl: "/images/devta-anuncio-lanzamiento.png",
      href: "/dashboard/marketplace/programacion-web",
      active: true,
    }));
  }
}, (app) => {
  try {
    const ads = app.findCollectionByNameOrId("ttmcobuild_dashboard_ads");
    const record = app.findFirstRecordByFilter(ads, 'slot = "launch"');
    app.delete(record);
  } catch {
    // The launch ad may not exist yet.
  }
});
