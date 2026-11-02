migrate((app) => {
  const orders = app.findCollectionByNameOrId("ttmcobuild_orders");
  const profiles = app.findCollectionByNameOrId("ttmcobuild_profiles");

  const payments = new Collection({
    type: "base",
    name: "ttmcobuild_order_payments",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: "order", type: "relation", required: true, maxSelect: 1, collectionId: orders.id, cascadeDelete: false },
      { name: "method", type: "select", required: true, maxSelect: 1, values: ["BANK_TRANSFER"] },
      { name: "amount", type: "number", required: true, min: 0 },
      { name: "currency", type: "select", required: true, maxSelect: 1, values: ["ARS", "USD"] },
      { name: "status", type: "select", required: true, maxSelect: 1, values: ["PENDING", "APPROVED", "REJECTED", "EXPIRED"] },
      { name: "requestedBy", type: "relation", required: true, maxSelect: 1, collectionId: profiles.id, cascadeDelete: false },
      { name: "confirmedBy", type: "relation", maxSelect: 1, collectionId: profiles.id, cascadeDelete: false },
      { name: "confirmedAt", type: "date" },
      { name: "createdAt", type: "date", required: true },
      { name: "updatedAt", type: "date", required: true },
    ],
    indexes: [
      "CREATE INDEX idx_ttmcobuild_order_payments_order_created ON ttmcobuild_order_payments (order, createdAt DESC)",
    ],
  });

  app.save(payments);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("ttmcobuild_order_payments"));
});
