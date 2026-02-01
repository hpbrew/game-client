import { WebGPURenderer } from "three/webgpu"
import { PCFSoftShadowMap } from "three"
async function initializeWebGPU() {
    try {
        const renderer = new WebGPURenderer({ antialias: true })
        // WebGPURenderer requires async initialization
        await renderer?.init()

        return renderer

    } catch (err) {
        console.error("WebGPU not supported, WebGPU is required for this application", err)
        return
    }
}

export const useWebGPURenderer = async () => {

    const renderer = await initializeWebGPU()

    if (!renderer) return

    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = PCFSoftShadowMap

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio || 1)

    // this.renderer.gammaFactor = 2.2
    document.body.appendChild(renderer.domElement)

    return {
        renderer
    }


}