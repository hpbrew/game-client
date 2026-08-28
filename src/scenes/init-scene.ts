import { Vector3, WebGPURenderer } from "three/webgpu"
import { Color, Scene } from "three"
import { useGui } from "./gui"
import { useBaseSkybox } from "./skybox"
import { Player } from "../entities/player"
import { useLighting } from "./lighting"
import { UseCameraType } from "./camera"
import { logger } from "@/shared/logger"

//@ts-ignore-line
import { TerrainChunkManager } from "../entities/terrain/terrain"

import { KeyMapperType } from "@/controllers/keys"
import { useScenery } from "../entities/scenery/scenery"

interface UseSceneParams {
  renderer: WebGPURenderer
}

export const useScene = ({ renderer }: UseSceneParams) => {
  const scene = new Scene()

  logger.log("Scene initialized.")

  const skyboxArea = useBaseSkybox()
  scene.background = skyboxArea?.texture || new Color("skyblue")

  const { gui, guiParams } = useGui()

  const player = new Player()
  scene.add(player)

  const terrainChunkManager = new TerrainChunkManager({
    scene,
    target: player,
    gui,
    guiParams,
    threejs: renderer,
  })

  player.sampleTerrainHeight(terrainChunkManager)

  const { update: updateScenery } = useScenery({
    scene,
    terrainChunkManager,
    player,
  })

  const lighting = useLighting()
  scene.add(lighting.directionalLight)
  scene.add(lighting.ambientLight)

  function updateScene(
    delta: number,
    CameraViewer: UseCameraType,
    keyMapper: KeyMapperType,
  ) {
    const actions = keyMapper.getActions()
    const axis = keyMapper.getAxis(CameraViewer.orbit.azimuth)

    // Run Updates
    player.update(
      delta,
      keyMapper,
      (vector3: Vector3) =>
        terrainChunkManager.getHeightAt(vector3.x, vector3.z),
      CameraViewer.orbit.azimuth,
    )

    CameraViewer.updateCameraPosition(player.position, {
      rotation: player.rotation,
      syncRotation: !(actions.mouseLeft && actions.mouseRight),
    })

    updateScenery(delta)

    if (
      terrainChunkManager &&
      typeof terrainChunkManager.Update === "function"
    ) {
      terrainChunkManager.Update(delta)
    }
  }

  return {
    // Return scene-related objects and functions here
    scene,
    updateScene,
  }
}
