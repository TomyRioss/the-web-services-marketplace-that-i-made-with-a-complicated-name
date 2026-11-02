migrate((app) => {
  const payments = app.findCollectionByNameOrId("ttmcobuild_order_payments");
  const method = payments.fields.getByName("method");
  method.values = ["BANK_TRANSFER"];
  payments.fields.removeByName("preferenceId");
  payments.fields.removeByName("paymentId");
  payments.fields.removeByName("initPoint");
  app.save(payments);

  let claims;
  try {
    claims = app.findCollectionByNameOrId("ttmcobuild_order_payment_reconciliation_claims");
  } catch {
    claims = null;
  }
  if (claims) app.delete(claims);
}, () => {});
