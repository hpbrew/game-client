import { Camera, Scene } from "three"

export interface WindowListenerParams {
    scene: Scene;
    camera: Camera;
    renderer: any;
    resizeCamera: () => void;
}

export const useWindowListeners = (params: WindowListenerParams) => {
    // Window listeners setup code goes here

    const { scene, camera, renderer, resizeCamera } = params

    window.addEventListener(
        "resize",
        () => {
            resizeCamera()
            renderer.setSize(window.innerWidth, window.innerHeight)
        },
        false
    )
}