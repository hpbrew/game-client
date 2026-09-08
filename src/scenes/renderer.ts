import { PCFSoftShadowMap, WebGLRenderer } from "three"

export const useWebGPURenderer = async () => {
  const renderer = new WebGLRenderer({ antialias: true })
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFSoftShadowMap
  renderer.outputColorSpace = "srgb"

  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio || 1)
  document.body.appendChild(renderer.domElement)

  return { renderer }
}
