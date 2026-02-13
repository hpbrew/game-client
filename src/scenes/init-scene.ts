import { Color, Scene } from "three"
import { useGui } from "./gui"
import { useBaseSkybox } from "./skybox"
import { WindowListenerParams } from "./window-listeners"
import { Player } from "../objects/player"
import { TerrainChunkManager } from '../entities/terrain'
import { useLighting } from "./lighting"
import { WebGPURenderer } from 'three/webgpu'
import { UseCameraType } from "./camera"

interface UseSceneParams {
  renderer: WebGPURenderer,
  // CameraViewer: UseCameraType, // Replace with actual type if available
}

export const useScene = ({
  renderer
}: UseSceneParams) => {
  // Scene setup code goes here

  const scene = new Scene()


  console.log("Scene initialized.")

  const skyboxArea = useBaseSkybox()
  scene.background = skyboxArea?.texture || new Color('skyblue')

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

  const lighting = useLighting()
  scene.add(lighting.directionalLight)
  scene.add(lighting.ambientLight)


  function updateScene(delta: number, CameraViewer: UseCameraType) {

    // Run Updates
    player.update(delta)
    CameraViewer.updateCameraPosition(player.position)

    if (terrainChunkManager && typeof terrainChunkManager.Update === 'function') {
      terrainChunkManager.Update(delta)
    }


  }

  return {
    // Return scene-related objects and functions here
    scene,
    updateScene
  }
}