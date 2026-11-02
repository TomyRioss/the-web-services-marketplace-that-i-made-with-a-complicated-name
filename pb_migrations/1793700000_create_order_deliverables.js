migrate((app) => {
  const orders = app.findCollectionByNameOrId("ttmcobuild_orders");
  const deliverables = new Collection({
    type: "base",
    name: "ttmcobuild_order_deliverables",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: "order", type: "relation", required: true, maxSelect: 1, collectionId: orders.id, cascadeDelete: true },
      { name: "repositoryUrl", type: "text", required: true, max: 300 },
      { name: "screenshots", type: "file", required: true, maxSelect: 3, maxSize: 5242880, mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"], protected: true },
      { name: "demoVideo", type: "file", required: true, maxSelect: 1, maxSize: 52428800, mimeTypes: ["video/mp4", "video/webm"], protected: true },
      { name: "demoDuration", type: "number", required: true, min: 20 },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_ttmcobuild_order_deliverables_order ON ttmcobuild_order_deliverables (order)",
    ],
  });
  app.save(deliverables);
}, (app) => {
  try {
    app.delete(app.findCollectionByNameOrId("ttmcobuild_order_deliverables"));
  } catch {
    // The collection may not have been created yet.
  }
});
