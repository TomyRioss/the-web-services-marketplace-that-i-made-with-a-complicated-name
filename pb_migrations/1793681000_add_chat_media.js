migrate((app) => {
  const messages = app.findCollectionByNameOrId("ttmcobuild_chat_messages");
  if (!messages.fields.getByName("attachments")) {
    messages.fields.add(new FileField({
      name: "attachments",
      maxSelect: 5,
      maxSize: 20971520,
      mimeTypes: [
        "image/jpeg", "image/png", "image/webp", "image/gif", "image/avif",
        "audio/mpeg", "audio/mp4", "audio/ogg", "audio/wav", "audio/webm", "audio/aac", "audio/x-m4a",
      ],
      protected: true,
    }));
  }
  app.save(messages);
}, (app) => {
  const messages = app.findCollectionByNameOrId("ttmcobuild_chat_messages");
  messages.fields.removeByName("attachments");
  app.save(messages);
});
