migrate((app) => {
  const notifications = app.findCollectionByNameOrId("ttmcobuild_notifications");
  notifications.fields.getByName("read").required = false;
  app.save(notifications);
}, (app) => {
  const notifications = app.findCollectionByNameOrId("ttmcobuild_notifications");
  notifications.fields.getByName("read").required = true;
  app.save(notifications);
});
