migrate((app) => {
  const attachments = app.findCollectionByNameOrId("ttmcobuild_order_attachments");
  attachments.fields.getByName("image").protected = true;
  app.save(attachments);
}, (app) => {
  const attachments = app.findCollectionByNameOrId("ttmcobuild_order_attachments");
  attachments.fields.getByName("image").protected = false;
  app.save(attachments);
});
