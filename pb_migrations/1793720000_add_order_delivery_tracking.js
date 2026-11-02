migrate((app) => {
  const deliverables = app.findCollectionByNameOrId("ttmcobuild_order_deliverables");
  deliverables.fields.add(new TextField({ name: "deliveryToken", max: 128 }));
  deliverables.fields.add(new DateField({ name: "chatDeliveredAt" }));
  deliverables.fields.add(new DateField({ name: "emailDeliveredAt" }));
  deliverables.fields.add(new DateField({ name: "deliveryTokenExpiresAt" }));
  deliverables.fields.add(new EmailField({ name: "deliveryEmail" }));
  app.save(deliverables);
}, (app) => {
  const deliverables = app.findCollectionByNameOrId("ttmcobuild_order_deliverables");
  for (const name of ["deliveryToken", "chatDeliveredAt", "emailDeliveredAt", "deliveryTokenExpiresAt", "deliveryEmail"]) {
    deliverables.fields.removeByName(name);
  }
  app.save(deliverables);
});
