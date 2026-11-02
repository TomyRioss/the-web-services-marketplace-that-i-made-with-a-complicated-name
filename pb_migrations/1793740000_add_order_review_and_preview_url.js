migrate((app) => {
  const orders = app.findCollectionByNameOrId("ttmcobuild_orders");
  const status = orders.fields.getByName("status");
  status.values = ["PENDING", "IN_PROGRESS", "REVIEW", "DONE", "CANCELLED"];
  app.save(orders);

  const deliverables = app.findCollectionByNameOrId("ttmcobuild_order_deliverables");
  deliverables.fields.add(new TextField({ name: "previewUrl", max: 500 }));
  app.save(deliverables);
}, (app) => {
  const deliverables = app.findCollectionByNameOrId("ttmcobuild_order_deliverables");
  deliverables.fields.removeByName("previewUrl");
  app.save(deliverables);

  const orders = app.findCollectionByNameOrId("ttmcobuild_orders");
  const status = orders.fields.getByName("status");
  status.values = ["PENDING", "IN_PROGRESS", "DONE", "CANCELLED"];
  app.save(orders);
});
