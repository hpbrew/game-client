// This file initializes the Three.js scene, camera, and renderer, and starts the animation loop.
// import Scene from "./scenes/scene"
import { useWebGPURenderer } from './scenes/renderer'
import { useCamera } from './scenes/camera'
import { useWindowListeners, type WindowListenerParams } from './scenes/window-listeners'
import { useScene } from './scenes/init-scene'
import { useKeyMapper } from './controllers/keys'

export async function init() {
  // Initialize renderer
  const rendererCreated = await useWebGPURenderer()

  if (!rendererCreated) {
    console.error("Failed to initialize renderer.")
    alert("WebGPU not supported, WebGPU is required for this game")
    return
  }

  const { renderer } = rendererCreated

  // Initialize camera
  // Can use this to swap out different camera types later
  const CameraViewer = useCamera()

  // Initialize scene
  const { scene, updateScene } = useScene({
    renderer
  })


  // Setup window listeners
  const listenerParams: WindowListenerParams = {
    scene,
    cameraViewer: CameraViewer,
    renderer
  }

  const keyMapper = useKeyMapper()
  useWindowListeners(listenerParams, keyMapper)


  // Animation loop
  let lastTime = performance.now()
  function animate(time: number = performance.now()) {
    requestAnimationFrame(animate)

    const delta = (time - lastTime) / 1000
    lastTime = time

    updateScene(delta, CameraViewer, keyMapper)

    renderer.render(scene, CameraViewer.camera)
  }
  animate()
}


