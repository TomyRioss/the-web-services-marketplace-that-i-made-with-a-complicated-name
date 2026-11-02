migrate((app) => {
  const services = app.findCollectionByNameOrId("ttmcobuild_services");
  services.fields.add(new NumberField({ name: "advancePaymentPercent" }));
  app.save(services);

  const records = app.findRecordsByFilter("ttmcobuild_services", "", "", 0, 0);
  for (const record of records) {
    record.set("advancePaymentPercent", 100);
    app.save(record);
  }
}, (app) => {
  const services = app.findCollectionByNameOrId("ttmcobuild_services");
  services.fields.removeByName("advancePaymentPercent");
  app.save(services);
});
