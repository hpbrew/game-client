import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js"
import { TextureLoader } from "three/src/loaders/TextureLoader.js"
import { RepeatWrapping } from "three"

export const loadedModels = new Map()
export const loadedTextures = new Map()

function loadFBX(resourcePath, resourceName) {
  return new Promise((resolve) => {
    const fbx = new FBXLoader()
    fbx.setPath(resourcePath)
    fbx.load(resourceName, (e) => {
      return resolve(e)
    })
  })
}

export const loadModel = async (resourcePath, resourceName, assetType) => {
  const key = `${resourcePath}${resourceName}`
  // If we've seen this key before, return the cached entity or wait for the in-progress load
  if (loadedModels.has(key)) {
    const entry = loadedModels.get(key)
    if (entry.entity) {
      return entry.entity.clone(true)
    }
    // wait for existing promise
    try {
      const ent = await entry.promise

      return ent.clone(true)
    } catch (err) {
      // previous load failed; fall through to start a new one
      loadedModels.delete(key)
    }
  }

  // Start loading and store a promise placeholder to avoid duplicate loads
  const promise = (async () => {
    try {
      let entity = null
      if (assetType === "fbx") {
        entity = await loadFBX(resourcePath, resourceName)
      } else if (assetType === "glb") {
        // TODO: implement GLB loader if needed
        throw new Error("glb loader not implemented")
      } else {
        throw new Error("Unknown asset type: " + assetType)
      }

      // cache resolved entity
      loadedModels.set(key, { promise, entity })
      return entity
    } catch (err) {
      // remove failed entry
      loadedModels.delete(key)
      throw err
    }
  })()

  // store placeholder entry so concurrent callers wait on the same promise
  loadedModels.set(key, { promise, entity: null })

  const entity = await promise
  return entity.clone(true)
}

function loadIndividualTexture(resourcePath, resourceName) {
  return new Promise((resolve) => {
    const texture = new TextureLoader()
    texture.setPath(resourcePath)
    const loadedTexture = texture.load(resourceName, (e) => {
      return resolve(e)
    })

    return resolve(loadedTexture)
  })
}

export const loadTexture = async (
  resourcePath,
  resourceName,
  { wrap } = { wrap: false }
) => {
  const key = `${resourcePath}${resourceName}`
  // If we've seen this key before, return the cached texture or wait for the in-progress load
  if (loadedTextures.has(key)) {
    const entry = loadedTextures.get(key)
    if (entry.texture) {
      return entry.texture.clone(true)
    }
    // wait for existing promise
    try {
      const ent = await entry.promise

      return ent.clone(true)
    } catch (err) {
      // previous load failed; fall through to start a new one
      loadedTextures.delete(key)
    }
  }

  // Start loading and store a promise placeholder to avoid duplicate loads
  const promise = (async () => {
    try {
      let texture = await loadIndividualTexture(resourcePath, resourceName)

      if (wrap) {
        texture.wrapS = RepeatWrapping
        texture.wrapT = RepeatWrapping
      }
      // cache resolved texture
      loadedTextures.set(key, { promise, texture })
      return texture
    } catch (err) {
      // remove failed entry
      loadedTextures.delete(key)
      throw err
    }
  })()

  // store placeholder entry so concurrent callers wait on the same promise
  loadedTextures.set(key, { promise, entity: null })

  const entity = await promise
  return entity.clone(true)
}
