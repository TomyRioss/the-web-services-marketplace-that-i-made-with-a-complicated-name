/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("ttmcobuild_chat_messages")

  // add field
  collection.fields.addAt(9, new Field({
    "help": "",
    "hidden": false,
    "id": "file1204091606",
    "maxSelect": 5,
    "maxSize": 20971520,
    "mimeTypes": [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
      "audio/mpeg",
      "audio/mp4",
      "audio/ogg",
      "audio/wav",
      "audio/webm",
      "audio/aac",
      "audio/x-m4a"
    ],
    "name": "attachments",
    "presentable": false,
    "protected": true,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("ttmcobuild_chat_messages")

  // remove field
  collection.fields.removeById("file1204091606")

  return app.save(collection)
})
