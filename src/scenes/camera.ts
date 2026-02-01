import { PerspectiveCamera } from "three"

export const useCamera = () => {
    // Camera scene setup code goes here

    const camera = new PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.1,
        10000
    )


    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
    }

    return {
        camera,
        onWindowResize
    }
}