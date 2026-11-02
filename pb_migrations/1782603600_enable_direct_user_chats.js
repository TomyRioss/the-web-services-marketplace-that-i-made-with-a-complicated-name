migrate((app) => {
  const messages = app.findCollectionByNameOrId("ttmcobuild_chat_messages");
  const profiles = app.findCollectionByNameOrId("ttmcobuild_profiles");

  messages.fields.getByName("order").required = false;
  messages.fields.add(new RelationField({
    name: "recipient",
    collectionId: profiles.id,
    maxSelect: 1,
    cascadeDelete: false,
  }));

  app.save(messages);
}, (app) => {
  const messages = app.findCollectionByNameOrId("ttmcobuild_chat_messages");
  messages.fields.removeByName("recipient");
  messages.fields.getByName("order").required = true;
  app.save(messages);
});
