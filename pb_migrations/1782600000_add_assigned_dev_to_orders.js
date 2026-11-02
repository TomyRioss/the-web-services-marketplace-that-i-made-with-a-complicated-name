migrate((app) => {
  const orders = app.findCollectionByNameOrId("ttmcobuild_orders");
  const profiles = app.findCollectionByNameOrId("ttmcobuild_profiles");

  orders.fields.add(new RelationField({
    name: "assignedDev",
    collectionId: profiles.id,
    maxSelect: 1,
    cascadeDelete: false,
  }));

  app.save(orders);
}, (app) => {
  const orders = app.findCollectionByNameOrId("ttmcobuild_orders");
  orders.fields.removeByName("assignedDev");
  app.save(orders);
});
