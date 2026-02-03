import {
    CanvasTexture,
} from 'three'


export const useBaseSkybox = () => {
    // Set a darker gradient skybox as the scene background
    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext("2d")
    if (!ctx) return undefined

    // Create vertical gradient (darker blue to gray)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, "#274472") // Dark blue
    gradient.addColorStop(0.7, "#4b6584") // Muted blue-gray
    gradient.addColorStop(1, "#b2bec3") // Light gray

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // this.scene.fog = new FogExp2(0x89b2eb, 0.0008)

    const texture = new CanvasTexture(canvas)
    return { texture }
}