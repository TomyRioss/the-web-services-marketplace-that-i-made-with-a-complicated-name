migrate((app) => {
  const profiles = app.findCollectionByNameOrId("ttmcobuild_profiles");
  const orders = app.findCollectionByNameOrId("ttmcobuild_orders");
  const notifications = new Collection({
    type: "base",
    name: "ttmcobuild_notifications",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: "recipient", type: "relation", required: true, maxSelect: 1, collectionId: profiles.id, cascadeDelete: false },
      { name: "order", type: "relation", required: true, maxSelect: 1, collectionId: orders.id, cascadeDelete: false },
      { name: "type", type: "select", required: true, maxSelect: 1, values: ["ASSIGNMENT", "MESSAGE", "STATUS"] },
      { name: "title", type: "text", required: true, max: 120 },
      { name: "message", type: "text", required: true, max: 500 },
      { name: "href", type: "text", required: true, max: 500 },
      { name: "createdAt", type: "date", required: true },
      { name: "read", type: "bool", required: false },
    ],
    indexes: [
      "CREATE INDEX idx_ttmcobuild_notifications_recipient_created ON ttmcobuild_notifications (recipient, createdAt DESC)",
      "CREATE INDEX idx_ttmcobuild_notifications_recipient_read ON ttmcobuild_notifications (recipient, read)",
    ],
  });
  app.save(notifications);
}, (app) => {
  try {
    app.delete(app.findCollectionByNameOrId("ttmcobuild_notifications"));
  } catch {
    // The collection may not have been created yet.
  }
});
