import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { createProceduralTree } from "./procedural-tree"

export type TreeSource = "model" | "procedural" | "mixed"

export interface SceneryCollisionRadii {
  player: number
  tree: number
}

export const sceneryCollisionRadii: SceneryCollisionRadii = {
  player: 0.75,
  tree: 1.25,
}

interface SceneryParams {
  scene: THREE.Scene
  terrainChunkManager: any // TODO: type properly
  player: THREE.Object3D
  treeSource?: TreeSource
}

export function useScenery({
  scene,
  terrainChunkManager,
  player,
  treeSource = "mixed",
}: SceneryParams) {
  const loader = new GLTFLoader()
  const sceneryObjects: THREE.Object3D[] = []
  const loadedPositions = new Set<string>()
  const maxDistance = 200 // Adjust as needed
  const numTrees = 2000 // Number of trees to place

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
  let treeModelLoadFailed = false
  if (treeSource !== "procedural") {
    const url = `${import.meta.env.BASE_URL}models/new/InitialTree.glb`
    loader.load(
      url,
      (gltf) => {
        treeModel = gltf.scene
        console.log("Tree model loaded")
      },
      undefined,
      (err) => {
        treeModelLoadFailed = true
        console.error("Failed to load InitialTree.glb:", err)
      },
    )
  }

  function getTreeSeed(pos: THREE.Vector3) {
    const value = Math.sin(pos.x * 12.9898 + pos.z * 78.233) * 43758.5453
    return Math.floor(Math.abs(value))
  }

  function loadScenery(pos: THREE.Vector3) {
    const seed = getTreeSeed(pos)
    const useModel =
      treeSource === "model" ||
      (treeSource === "mixed" && seed % 2 === 0 && !treeModelLoadFailed)

    if (useModel && !treeModel) return // Wait for the model or its load failure.

    const sceneryObject = useModel
      ? treeModel!.clone(true)
      : createProceduralTree(seed)
    sceneryObject.position.copy(pos)
    sceneryObject.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    scene.add(sceneryObject)
    sceneryObjects.push(sceneryObject)
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

  function resolvePlayerCollision(
    position: THREE.Vector3,
    radii: SceneryCollisionRadii = sceneryCollisionRadii,
  ) {
    const collisionDistance = radii.player + radii.tree

    // Resolve more than one tree so the player cannot get stuck between trunks.
    for (let pass = 0; pass < 3; pass++) {
      sceneryObjects.forEach((sceneryObject) => {
        const offsetX = position.x - sceneryObject.position.x
        const offsetZ = position.z - sceneryObject.position.z
        const distanceSquared = offsetX * offsetX + offsetZ * offsetZ

        if (distanceSquared >= collisionDistance * collisionDistance) return

        if (distanceSquared === 0) {
          position.x += collisionDistance
          return
        }

        const distance = Math.sqrt(distanceSquared)
        const pushDistance = collisionDistance - distance
        position.x += (offsetX / distance) * pushDistance
        position.z += (offsetZ / distance) * pushDistance
      })
    }
  }

  return {
    update,
    resolvePlayerCollision,
  }
}
