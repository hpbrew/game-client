// This file initializes the Three.js scene, camera, and renderer, and starts the animation loop.
// import Scene from "./scenes/scene"
import { useScene } from './scene1'
import { useWebGPURenderer } from './renderer'
import { Camera, Scene, Vector3, Mesh, BoxGeometry, MeshBasicMaterial, BoxHelper, Object3D } from 'three'
import { WebGPURenderer } from 'three/webgpu'
import { useCamera } from './camera'
import { Player } from '../objects/player'
import { useLighting } from './lighting'
import { useWindowListeners, type WindowListenerParams } from './window-listeners'


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
    const CameraViewer = useCamera()

    // Setup window listeners
    const listenerParams: WindowListenerParams = {
        scene,
        cameraViewer: CameraViewer,
        renderer
    }
    useWindowListeners(listenerParams)

    // Call scene init callback
    const renderables = onSceneInit(scene, CameraViewer.camera)

    // Animation loop
    let lastTime = performance.now()
    function animate(time: number = performance.now()) {
        requestAnimationFrame(animate)

        const delta = (time - lastTime) / 1000
        lastTime = time

        // Run Updates
        if (renderables && renderables.player && typeof renderables.player.update === 'function') {
            renderables.player.update(delta)
        }
        CameraViewer.updateCameraPosition(renderables.player.position)

        renderer.render(scene, CameraViewer.camera)
    }
    animate()
}

function onSceneInit(scene: Scene, camera: Camera) {
    console.log("Scene initialized.")

    const player = new Player()
    scene.add(player)

    const lighting = useLighting()
    scene.add(lighting.directionalLight)
    scene.add(lighting.ambientLight)
    // const terrainChunkManager = new TerrainChunkManager({
    //       scene: this.scene,
    //       target: this.player,
    //       gui: this.gui,
    //       guiParams: this.guiParams,
    //       threejs: this.renderer,
    //     })

    return { player }
}