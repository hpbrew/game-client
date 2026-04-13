import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

interface SceneryParams {
  scene: THREE.Scene
  terrainChunkManager: any // TODO: type properly
  player: THREE.Object3D
}

export function useScenery({
  scene,
  terrainChunkManager,
  player,
}: SceneryParams) {
  const loader = new GLTFLoader()
  const sceneryObjects: THREE.Object3D[] = []
  const loadedPositions = new Set<string>()
  const maxDistance = 100 // Adjust as needed
  const numTrees = 100 // Number of trees to place

  // Generate random positions centered around player's initial position
  const positions: THREE.Vector3[] = []
  const centerX = player.position.x
  const centerZ = player.position.z
  for (let i = 0; i < numTrees; i++) {
    const x = centerX + (Math.random() - 0.5) * 2000 // Spread over a large area around center
    const z = centerZ + (Math.random() - 0.5) * 2000
    const y = terrainChunkManager?.getHeightAt(x, z) || 0
    positions.push(new THREE.Vector3(x, y, z))
  }

  // Load the tree model once
  let treeModel: THREE.Object3D | null = null
  const url = `${import.meta.env.BASE_URL}models/new/InitialTree.glb`
  loader.load(
    url,
    (gltf) => {
      treeModel = gltf.scene
      console.log("Tree model loaded")
    },
    undefined,
    (err) => {
      console.error("Failed to load InitialTree.glb:", err)
    },
  )

  function loadScenery(pos: THREE.Vector3) {
    if (!treeModel) return // Wait for model to load

    const model = treeModel.clone()
    model.position.copy(pos)
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    scene.add(model)
    sceneryObjects.push(model)
    loadedPositions.add(`${pos.x},${pos.y},${pos.z}`)
  }

  function unloadScenery(pos: THREE.Vector3) {
    const posKey = `${pos.x},${pos.y},${pos.z}`
    const index = sceneryObjects.findIndex((obj) => obj.position.equals(pos))
    if (index !== -1) {
      scene.remove(sceneryObjects[index])
      // Dispose if needed, but for now just remove
      sceneryObjects.splice(index, 1)
      loadedPositions.delete(posKey)
    }
  }

  function update(delta: number) {
    const playerPos = player.position.clone()

    positions.forEach((pos) => {
      const dist = playerPos.distanceTo(pos)
      const posKey = `${pos.x},${pos.y},${pos.z}`

      if (dist < maxDistance && !loadedPositions.has(posKey)) {
        loadScenery(pos)
      } else if (dist >= maxDistance && loadedPositions.has(posKey)) {
        unloadScenery(pos)
      }
    })
  }

  return { update }
}
