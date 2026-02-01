import { AmbientLight, DirectionalLight } from "three"


export const useLighting = () => {
    // Lighting scene setup code goes here

    // Create a directional light
    const directionalLight = new DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 10, 7.5)
    directionalLight.castShadow = true

    // Create an ambient light
    const ambientLight = new AmbientLight(0x404040, 0.5) // soft white light

    return {
        directionalLight,
        ambientLight
    }
}