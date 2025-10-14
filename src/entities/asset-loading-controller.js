import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js"

export const loadedAssets = new Map()

function LoadFBX(resourcePath, resourceName) {
  return new Promise((resolve) => {
    const fbx = new FBXLoader()
    fbx.setPath(resourcePath)
    fbx.load(resourceName, (e) => {
      return resolve(e)
    })
  })
}

export const loadAsset = async (resourcePath, resourceName, assetType) => {
  const key = `${resourcePath}${resourceName}`
  // If we've seen this key before, return the cached entity or wait for the in-progress load
  if (loadedAssets.has(key)) {
    const entry = loadedAssets.get(key)
    if (entry.entity) {
      return entry.entity.clone(true)
    }
    // wait for existing promise
    try {
      const ent = await entry.promise

      return ent.clone(true)
    } catch (err) {
      // previous load failed; fall through to start a new one
      loadedAssets.delete(key)
    }
  }

  // Start loading and store a promise placeholder to avoid duplicate loads
  const promise = (async () => {
    try {
      let entity = null
      if (assetType === "fbx") {
        entity = await LoadFBX(resourcePath, resourceName)
      } else if (assetType === "glb") {
        // TODO: implement GLB loader if needed
        throw new Error("glb loader not implemented")
      } else {
        throw new Error("Unknown asset type: " + assetType)
      }

      // cache resolved entity
      loadedAssets.set(key, { promise, entity })
      return entity
    } catch (err) {
      // remove failed entry
      loadedAssets.delete(key)
      throw err
    }
  })()

  // store placeholder entry so concurrent callers wait on the same promise
  loadedAssets.set(key, { promise, entity: null })

  const entity = await promise
  return entity.clone(true)
}
