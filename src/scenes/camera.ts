import { PerspectiveCamera, Vector3 } from "three"

export const useThirdPersonCamera = () => {
    // Camera scene setup code goes here

    const camera = new PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.1,
        10000
    )

    // Initial camera position
    camera.position.set(0, 2, 5)

    // Camera orbit parameters for third-person view
    const orbit = {
        azimuth: 0, // horizontal angle
        polar: Math.PI / 4, // vertical angle
        radius: 5 // distance from target
    }

    // Offset to look slightly above the player
    const cameraTargetOffset = new Vector3(0, 1, 0)

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
    }

    function updateCameraPosition(targetPosition: Vector3) {
        // Spherical to Cartesian conversion
        const { azimuth, polar, radius } = orbit

        // Invert the azimuth to move the camera to the opposite side of the target
        const oppositeAzimuth = azimuth + Math.PI

        const x =
            targetPosition.x +
            radius * Math.sin(polar) * Math.sin(oppositeAzimuth)
        let y = targetPosition.y + radius * Math.cos(polar)
        const z =
            targetPosition.z +
            radius * Math.sin(polar) * Math.cos(oppositeAzimuth)

        // Compute the actual target we want the camera to look at (player + offset)
        const target = new Vector3()
        target.copy(targetPosition).add(cameraTargetOffset)

        // TODO::::: Prevent camera from going below the terrain relative to the target
        // if (
        //   this.terrainChunkManager &&
        //   typeof this.terrainChunkManager.getHeightAt === "function"
        // ) {
        //   const terrainY = this.terrainChunkManager.getHeightAt(x, z) + 0.2 // small offset above ground
        //   if (y < terrainY) y = terrainY
        // }

        camera.position.set(x, y, z)
        camera.lookAt(target)
    }

    return {
        camera,
        onWindowResize,
        updateCameraPosition
    }
}