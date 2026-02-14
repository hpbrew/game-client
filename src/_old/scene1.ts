import { Scene } from 'three'
import { WebGPURenderer } from 'three/webgpu'

interface UseSceneParams {
    renderer?: WebGPURenderer
}

export const useScene = ({
    // renderer
}: UseSceneParams) => {
    // Scene setup code goes here

    const scene = new Scene()

    return {
        // Return scene-related objects and functions here
        scene
    }
}