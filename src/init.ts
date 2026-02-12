// This file initializes the Three.js scene, camera, and renderer, and starts the animation loop.
// import Scene from "./scenes/scene"
import { useScene } from "./scenes/scene1"
import { useWebGPURenderer } from "./scenes/renderer"
import {
  Color,
} from "three"
import { useCamera } from "./scenes/camera"
import { Player } from "./objects/player"
import { useLighting } from "./scenes/lighting"
import {
  useWindowListeners,
  type WindowListenerParams,
} from "./scenes/window-listeners"
import { TerrainChunkManager } from "./entities/terrain"
import { useGui } from "./scenes/gui"
import { useBaseSkybox } from "./scenes/skybox"

export async function init() {
  // Initialize renderer
  const rendererCreated = await useWebGPURenderer()

  if (!rendererCreated) {
    console.error("Failed to initialize renderer.")
    alert("WebGPU not supported, WebGPU is required for this game")
    return
  }

  const { renderer } = rendererCreated

  // Initialize scene
  const { scene } = useScene({
    // renderer
  })

  // Initialize camera
  // Can use this to swap out different camera types later
  const CameraViewer = useCamera()

  // Setup window listeners
  const listenerParams: WindowListenerParams = {
    scene,
    cameraViewer: CameraViewer,
    renderer,
  }
  useWindowListeners(listenerParams)

  // Call scene init callback
  const renderables = onSceneInit(listenerParams)

  // Animation loop
  let lastTime = performance.now()
  function animate(time: number = performance.now()) {
    requestAnimationFrame(animate)

    const delta = (time - lastTime) / 1000
    lastTime = time

    // Run Updates
    if (
      renderables &&
      renderables.player &&
      typeof renderables.player.update === "function"
    ) {
      renderables.player.update(delta)
    }
    if (
      renderables &&
      renderables.terrainChunkManager &&
      typeof renderables.terrainChunkManager.Update === "function"
    ) {
      renderables.terrainChunkManager.Update(delta)
    }
    CameraViewer.updateCameraPosition(renderables.player.position)

    renderer.render(scene, CameraViewer.camera)
  }
  animate()
}

function onSceneInit(params: WindowListenerParams) {
  console.log("Scene initialized.")
  const { scene, renderer } = params

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

  const lighting = useLighting()
  scene.add(lighting.directionalLight)
  scene.add(lighting.ambientLight)

  return { player, terrainChunkManager }
}
