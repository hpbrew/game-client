import { AmbientLight, DirectionalLight } from "three"


export const useLighting = () => {
    // Lighting scene setup code goes here

    // Create a directional light
    const directionalLight = new DirectionalLight(0xffffff, 1)
    directionalLight.position.set(10, 20, 10)
    directionalLight.position.set(-100, 100, 100)
    directionalLight.target.position.set(0, 0, 0)
    directionalLight.castShadow = true
    directionalLight.shadow.bias = -0.001
    directionalLight.shadow.mapSize.width = 4096
    directionalLight.shadow.mapSize.height = 4096
    directionalLight.shadow.camera.near = 0.1
    directionalLight.shadow.camera.far = 500.0
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 500.0
    directionalLight.shadow.camera.left = 50
    directionalLight.shadow.camera.right = -50
    directionalLight.shadow.camera.top = 50
    directionalLight.shadow.camera.bottom = -50

    // Create an ambient light
    const ambientLight = new AmbientLight(0x101010)

    return {
        directionalLight,
        ambientLight
    }
}