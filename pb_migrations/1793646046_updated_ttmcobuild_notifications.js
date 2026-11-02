/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("ttmcobuild_notifications")
  const readField = collection.fields.getByName("read")
  if (readField) {
    readField.required = false
  } else {
    collection.fields.add(new BoolField({ name: "read", required: false }))
  }

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("ttmcobuild_notifications")
  const readField = collection.fields.getByName("read")
  if (readField) readField.required = true

  return app.save(collection)
})
