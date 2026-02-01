// This file initializes the Three.js scene, camera, and renderer, and starts the animation loop.
// import Scene from "./scenes/scene"
import { useScene } from './scene1'
import { useWebGPURenderer } from './renderer'
import { Camera, Scene, Vector3, Mesh, BoxGeometry, MeshBasicMaterial, BoxHelper, Object3D } from 'three'
import { WebGPURenderer } from 'three/webgpu'
import { useCamera } from './camera'


export async function init() {
    // Initialize renderer
    const rendererCreated = await useWebGPURenderer()

    if (!rendererCreated) {
        console.error("Failed to initialize renderer.")
        alert("WebGPU not supported, WebGPU is required for this game")
        return
    }

    const { renderer } = rendererCreated

    // Initialize scene
    const { scene } = useScene({
        // renderer
    })

    // Initialize camera
    // Can use this to swap out different camera types later
    const { camera } = useCamera()


    // Call scene init callback
    onSceneInit(scene, camera)

    // Animation loop
    function animate() {
        requestAnimationFrame(animate)

        // Update scene and camera here as needed

        renderer.render(scene, camera)
    }
    animate()
}

function onSceneInit(scene: Scene, camera: Camera) {
    console.log("Scene initialized.")

    // create a simple box for the camera to look at
    const boxGeo = new BoxGeometry(1, 1, 1)
    const boxMat = new MeshBasicMaterial({ color: 0x00ff00 })
    const box = new Mesh(boxGeo, boxMat)
    box.name = 'focusBox'
    box.position.set(0, 0.5, 0)
    scene.add(box)

    // add a helper to outline the box so it's easy to see
    const helper = new BoxHelper(box, 0xffff00)
    scene.add(helper)

    // position the camera (if not already positioned) and make it look at the box
    if ((camera as any).position) {
        (camera as any).position.set(0, 2, 5)
    }
    camera.lookAt(box.position)

    // const terrainChunkManager = new TerrainChunkManager({
    //       scene: this.scene,
    //       target: this.player,
    //       gui: this.gui,
    //       guiParams: this.guiParams,
    //       threejs: this.renderer,
    //     })
}