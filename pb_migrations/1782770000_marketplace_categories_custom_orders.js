migrate((app) => {
  const services = app.findCollectionByNameOrId("ttmcobuild_services");
  const orders = app.findCollectionByNameOrId("ttmcobuild_orders");
  services.fields.add(new SelectField({
    name: "category",
    maxSelect: 1,
    values: ["programacion-web", "automatizacion", "saas-desde-cero", "tienda-online"],
  }));
  orders.fields.getByName("service").required = false;
  orders.fields.add(new BoolField({ name: "isCustom" }));
  app.save(services);
  app.save(orders);

  const attachments = new Collection({
    type: "base",
    name: "ttmcobuild_order_attachments",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: "order", type: "relation", required: true, maxSelect: 1, collectionId: orders.id, cascadeDelete: true },
      { name: "image", type: "file", required: true, maxSelect: 1, maxSize: 52428800, mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"], protected: true },
    ],
    indexes: ["CREATE INDEX idx_ttmcobuild_order_attachments_order ON ttmcobuild_order_attachments (order)"],
  });
  app.save(attachments);
}, (app) => {
  try { app.delete(app.findCollectionByNameOrId("ttmcobuild_order_attachments")); } catch {}
  const services = app.findCollectionByNameOrId("ttmcobuild_services");
  const orders = app.findCollectionByNameOrId("ttmcobuild_orders");
  services.fields.removeByName("category");
  orders.fields.removeByName("isCustom");
  orders.fields.getByName("service").required = true;
  app.save(services);
  app.save(orders);
});
