migrate((app) => {
  const services = app.findCollectionByNameOrId("ttmcobuild_services");
  services.fields.add(new BoolField({ name: "promotionActive" }));
  services.fields.add(new NumberField({ name: "promotionPriceArs" }));
  app.save(services);
}, (app) => {
  const services = app.findCollectionByNameOrId("ttmcobuild_services");
  services.fields.removeByName("promotionActive");
  services.fields.removeByName("promotionPriceArs");
  app.save(services);
});
