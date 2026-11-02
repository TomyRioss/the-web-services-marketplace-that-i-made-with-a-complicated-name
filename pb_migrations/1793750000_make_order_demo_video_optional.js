migrate((app) => {
  const deliverables = app.findCollectionByNameOrId("ttmcobuild_order_deliverables");
  deliverables.fields.getByName("demoVideo").required = false;
  deliverables.fields.getByName("demoDuration").required = false;
  app.save(deliverables);
}, (app) => {
  const deliverables = app.findCollectionByNameOrId("ttmcobuild_order_deliverables");
  deliverables.fields.getByName("demoVideo").required = true;
  deliverables.fields.getByName("demoDuration").required = true;
  app.save(deliverables);
});
