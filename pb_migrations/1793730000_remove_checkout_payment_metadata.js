migrate((app) => {
  const payments = app.findCollectionByNameOrId("ttmcobuild_order_payments");
  const method = payments.fields.getByName("method");
  method.values = ["BANK_TRANSFER"];
  app.save(payments);
}, () => {});
