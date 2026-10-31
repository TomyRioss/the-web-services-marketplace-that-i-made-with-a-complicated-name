migrate((app) => {
  try {
    app.findCollectionByNameOrId("ttmcobuild_chat_messages");
    return; // Already created (e.g. applied directly on the server).
  } catch {
    // Not found — create it below.
  }

  const orders = app.findCollectionByNameOrId("ttmcobuild_orders");
  const profiles = app.findCollectionByNameOrId("ttmcobuild_profiles");

  const chatMessages = new Collection({
    type: "base",
    name: "ttmcobuild_chat_messages",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: "legacyId", type: "text", max: 64 },
      { name: "order", type: "relation", required: true, maxSelect: 1, cascadeDelete: true, collectionId: orders.id },
      { name: "author", type: "relation", required: true, maxSelect: 1, cascadeDelete: false, collectionId: profiles.id },
      { name: "authorRole", type: "select", required: true, maxSelect: 1, values: ["CLIENTE", "DEV", "ADMIN", "OWNER"] },
      { name: "message", type: "text", required: true, min: 1, max: 5000 },
      { name: "createdAt", type: "date", required: true },
      { name: "updatedAt", type: "date", required: true },
    ],
    indexes: [
      "CREATE INDEX idx_ttmcobuild_chat_order_created ON ttmcobuild_chat_messages (order, createdAt)",
      "CREATE UNIQUE INDEX idx_ttmcobuild_chat_legacy_id ON ttmcobuild_chat_messages (legacyId) WHERE legacyId != ''",
    ],
  });
  app.save(chatMessages);
}, (app) => {
  try {
    app.delete(app.findCollectionByNameOrId("ttmcobuild_chat_messages"));
  } catch {
    // The collection may not have been created yet.
  }
});
