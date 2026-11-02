migrate((app) => {
  const payments = app.findCollectionByNameOrId("ttmcobuild_order_payments");
  payments.fields.add(new SelectField({ name: "purpose", maxSelect: 1, values: ["ADVANCE", "BALANCE"] }));
  payments.fields.add(new NumberField({ name: "totalAmount", min: 0 }));
  app.save(payments);
}, (app) => {
  const payments = app.findCollectionByNameOrId("ttmcobuild_order_payments");
  payments.fields.removeByName("purpose");
  payments.fields.removeByName("totalAmount");
  app.save(payments);
});
