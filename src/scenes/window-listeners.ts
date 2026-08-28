import { Camera, Scene } from "three"
import { UseCameraType } from "./camera"
import { KeyMapperType, useKeyMapper } from "../controllers/keys"
import { WebGPURenderer } from "three/webgpu"

export interface WindowListenerParams {
  scene: Scene
  cameraViewer: UseCameraType
  renderer: WebGPURenderer
}

export const useWindowListeners = (
  params: WindowListenerParams,
  keyMapper: KeyMapperType,
) => {
  // Window listeners setup code goes here

  const { scene, cameraViewer, renderer } = params

  const { getActions, keyDownHandler, keyUpHandler, mouseHandler } = keyMapper

  window.addEventListener(
    "resize",
    () => {
      cameraViewer.onWindowResize()
      renderer.setSize(window.innerWidth, window.innerHeight)
    },
    false,
  )

  // Add scroll wheel zoom for camera
  window.addEventListener(
    "wheel",
    (e: WheelEvent) => {
      e.preventDefault()
      cameraViewer.onMouseWheel(e)
    },
    { passive: false },
  )

  window.addEventListener("keydown", (event) => {
    keyDownHandler(event)
  })

  window.addEventListener("keyup", (event) => {
    keyUpHandler(event)
  })

  renderer.domElement.addEventListener("mousemove", (event: MouseEvent) => {
    // Implement mouse movement handling if needed
    const actions = getActions()
    cameraViewer.onMouseMove(event, actions.mouseLeft, actions.mouseRight)
  })

  // Mouse events
  renderer.domElement.addEventListener("mousedown", (event) => {
    renderer.domElement.requestPointerLock()
    mouseHandler(event, true)
  })

  window.addEventListener("mouseup", (event) => {
    mouseHandler(event, false)

    const activeKeys = getActions()
    if (!activeKeys.mouseLeft && !activeKeys.mouseRight) {
      document.exitPointerLock()
    }
  })

  // Pointer events catch Mac trackpad presses and other pointer devices
  window.addEventListener("pointerdown", (event) => {
    console.log("pointerdown", event)
    mouseHandler(event as PointerEvent, true)
  })

  window.addEventListener("pointerup", (event) => {
    mouseHandler(event as PointerEvent, false)
  })
}
