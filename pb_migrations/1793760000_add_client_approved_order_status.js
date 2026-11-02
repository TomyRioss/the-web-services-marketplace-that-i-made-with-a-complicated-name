migrate((app) => {
  const orders = app.findCollectionByNameOrId("ttmcobuild_orders");
  const status = orders.fields.getByName("status");
  status.values = ["PENDING", "IN_PROGRESS", "REVIEW", "APPROVED", "DONE", "CANCELLED"];
  app.save(orders);
}, (app) => {
  const orders = app.findCollectionByNameOrId("ttmcobuild_orders");
  const status = orders.fields.getByName("status");
  status.values = ["PENDING", "IN_PROGRESS", "REVIEW", "DONE", "CANCELLED"];
  app.save(orders);
});
