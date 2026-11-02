migrate((app) => {
  const orders = app.findCollectionByNameOrId("ttmcobuild_orders");
  const profiles = app.findCollectionByNameOrId("ttmcobuild_profiles");

  orders.fields.add(new TextField({ name: "assignmentNote", max: 4000 }));
  orders.fields.add(new RelationField({
    name: "assignedBy",
    collectionId: profiles.id,
    maxSelect: 1,
    cascadeDelete: false,
  }));

  app.save(orders);
}, (app) => {
  const orders = app.findCollectionByNameOrId("ttmcobuild_orders");
  orders.fields.removeByName("assignedBy");
  orders.fields.removeByName("assignmentNote");
  app.save(orders);
});
