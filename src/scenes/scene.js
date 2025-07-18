import * as THREE from "three"
import { getSmileyTexture } from "./smileyTexture"
import { createNearbyBox } from "../objects"
import { QuadtreeFloor } from "../objects/quadtreeFloor"

class Scene {
    constructor() {
        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        )
        this.renderer = new THREE.WebGLRenderer()
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        document.body.appendChild(this.renderer.domElement)

        this.cube = null
        this.floor = null
        this.nearbyBox = null // Store reference to the nearby box
        this.movement = { x: 0, y: 0, z: 0 }
        this.isJumping = false
        this.canDoubleJump = false // Add this line
        this.jumpVelocity = 0
        this.gravity = -0.01

        // Add for jump movement
        this.jumpHorizontal = { x: 0, z: 0 }

        // Camera orbit controls state
        this.isDragging = false
        this.prevMouse = { x: 0, y: 0 }
        this.orbit = { azimuth: 0, polar: Math.PI / 4, radius: 8 } // Camera spherical coords
        this.targetAzimuth = this.orbit.azimuth // Add this line

        // For smooth rotation
        this.targetRotationY = 0
        this.rotationLerpSpeed = 0.15

        this.mouseButtons = { left: false, right: false } // Track mouse button states

        // Create a div for displaying cube position
        this.positionDiv = document.createElement("div")
        this.positionDiv.style.position = "fixed"
        this.positionDiv.style.top = "10px"
        this.positionDiv.style.left = "10px"
        this.positionDiv.style.background = "rgba(0,0,0,0.7)"
        this.positionDiv.style.color = "#fff"
        this.positionDiv.style.padding = "6px 12px"
        this.positionDiv.style.fontFamily = "monospace"
        this.positionDiv.style.fontSize = "14px"
        this.positionDiv.style.borderRadius = "6px"
        this.positionDiv.style.zIndex = "1000"
        document.body.appendChild(this.positionDiv)
    }

    init() {
        this.addObjects()
        this.addEventListeners()
        this.animate()
    }

    addObjects() {
        // Add the cube
        const cubeGeometry = new THREE.BoxGeometry()
        // Create materials for each face
        const materials = []

        // Get the smiley texture from the helper function
        const smileyTexture = getSmileyTexture()

        // Assign materials: [right, left, top, bottom, front, back]
        for (let i = 0; i < 6; i++) {
            if (i === 5) {
                // Back face (smiley)
                materials.push(new THREE.MeshBasicMaterial({ map: smileyTexture }))
            } else {
                // Other faces (green)
                materials.push(new THREE.MeshBasicMaterial({ color: 0x00ff00 }))
            }
        }

        this.cube = new THREE.Mesh(cubeGeometry, materials)
        // Add a black border using EdgesGeometry and LineSegments
        const edges = new THREE.EdgesGeometry(cubeGeometry)
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x000000,
            linewidth: 2,
        })
        const line = new THREE.LineSegments(edges, lineMaterial)
        this.cube.add(line)

        this.cube.position.y = 0.5
        this.scene.add(this.cube)

        // Replace old floor with quadtree LOD floor
        this.floor = new QuadtreeFloor({
            worldSize: 200, // Make the floor large
            minTileSize: 10, // Each tile is 10x10 units
            maxSegments: 64, // Highest LOD segments per tile
            minSegments: 8, // Lowest LOD segments per tile
            lodDistances: [20, 40, 80, 160], // LOD switch distances
        })
        this.scene.add(this.floor)

        // Add the nearby box from the objects module, using the floor for height
        this.nearbyBox = createNearbyBox(this.floor)
        this.scene.add(this.nearbyBox)

        // Set initial target rotation to match cube's rotation
        this.targetRotationY = this.cube.rotation.y

        // Set initial camera position using spherical coordinates
        this.updateCameraPosition()

        // Set a darker gradient skybox as the scene background
        const canvas = document.createElement("canvas")
        canvas.width = 512
        canvas.height = 512
        const ctx = canvas.getContext("2d")

        // Create vertical gradient (darker blue to gray)
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
        gradient.addColorStop(0, "#274472") // Dark blue
        gradient.addColorStop(0.7, "#4b6584") // Muted blue-gray
        gradient.addColorStop(1, "#b2bec3") // Light gray

        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const texture = new THREE.CanvasTexture(canvas)
        this.scene.background = texture

        // Add a blue circle to the front side of the cube
        const frontCircleGeometry = new THREE.CircleGeometry(0.18, 32)
        const frontCircleMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff })
        const frontBlueCircle = new THREE.Mesh(
            frontCircleGeometry,
            frontCircleMaterial
        )
        // Position the circle at the center of the front face (z = 0.5 for default cube)
        frontBlueCircle.position.set(0, 0, 0.501)
        // Orient the circle to face outward from the front face
        // (no rotation needed for the front face)
        this.cube.add(frontBlueCircle)
    }

    addEventListeners() {
        window.addEventListener("keydown", (event) => {
            switch (event.key) {
                case "ArrowUp":
                case "w":
                case "W":
                    this.movement.z = -0.1
                    break
                case "ArrowDown":
                case "s":
                case "S":
                    this.movement.z = 0.1
                    break
                case "ArrowLeft":
                case "a":
                case "A":
                    this.movement.y = 0.045 // Start rotating left (slower)
                    break
                case "ArrowRight":
                case "d":
                case "D":
                    this.movement.y = -0.045 // Start rotating right (slower)
                    break
                case " ":
                    if (!this.isJumping) {
                        // First jump
                        this.isJumping = true
                        this.canDoubleJump = true // Allow double jump after first jump
                        this.jumpVelocity = 0.2
                        const angle = this.cube.rotation.y
                        this.jumpHorizontal.x =
                            Math.sin(angle) * this.movement.z +
                            Math.sin(angle - Math.PI / 2) * this.movement.x
                        this.jumpHorizontal.z =
                            Math.cos(angle) * this.movement.z +
                            Math.cos(angle - Math.PI / 2) * this.movement.x
                    } else if (this.canDoubleJump) {
                        // Double jump
                        this.jumpVelocity = 0.2
                        const angle = this.cube.rotation.y
                        this.jumpHorizontal.x =
                            Math.sin(angle) * this.movement.z +
                            Math.sin(angle - Math.PI / 2) * this.movement.x
                        this.jumpHorizontal.z =
                            Math.cos(angle) * this.movement.z +
                            Math.cos(angle - Math.PI / 2) * this.movement.x
                        this.canDoubleJump = false // Only allow one double jump
                    }
                    break
                case "q":
                case "Q":
                    this.movement.x = 0.1
                    break
                case "e":
                case "E":
                    this.movement.x = -0.1
                    break
                case "c":
                case "C":
                    this.movement.x = 0.1 // Strafe left
                    break
                case "v":
                case "V":
                    this.movement.x = -0.1 // Strafe right
                    break
            }
        })

        window.addEventListener("keyup", (event) => {
            switch (event.key) {
                case "ArrowUp":
                case "ArrowDown":
                case "w":
                case "W":
                case "s":
                case "S":
                    this.movement.z = 0
                    break
                case "ArrowLeft":
                case "a":
                case "A":
                case "ArrowRight":
                case "d":
                case "D":
                    this.movement.y = 0 // Stop rotating
                    break
                case "q":
                case "Q":
                case "e":
                case "E":
                    this.movement.x = 0
                    break
                case "c":
                case "C":
                case "v":
                case "V":
                    this.movement.x = 0 // Stop strafing
                    break
            }
        })

        // Mouse controls for camera orbit
        this.renderer.domElement.addEventListener("mousedown", (e) => {
            if (e.button === 0) this.mouseButtons.left = true
            if (e.button === 2) this.mouseButtons.right = true
            this.isDragging = true
            this.prevMouse.x = e.clientX
            this.prevMouse.y = e.clientY

            // Request pointer lock on either left or right mouse down
            if (document.pointerLockElement !== this.renderer.domElement) {
                this.renderer.domElement.requestPointerLock()
            }
        })

        window.addEventListener("mouseup", (e) => {
            if (e.button === 0) this.mouseButtons.left = false
            if (e.button === 2) this.mouseButtons.right = false

            // Stop moving the cube when either mouse button is released
            this.movement.z = 0

            // Only stop dragging if both buttons are released
            if (!this.mouseButtons.left && !this.mouseButtons.right) {
                this.isDragging = false

                // Exit pointer lock if no buttons are pressed
                if (document.pointerLockElement === this.renderer.domElement) {
                    document.exitPointerLock()
                }
            }
        })

        // Mouse move event for dragging
        window.addEventListener("mousemove", (e) => {
            if (!this.isDragging) return

            // Use movementX/Y if pointer is locked, otherwise fallback to delta calculation
            const deltaX =
                document.pointerLockElement === this.renderer.domElement
                    ? e.movementX
                    : e.clientX - this.prevMouse.x
            const deltaY =
                document.pointerLockElement === this.renderer.domElement
                    ? e.movementY
                    : e.clientY - this.prevMouse.y
            if (document.pointerLockElement !== this.renderer.domElement) {
                this.prevMouse.x = e.clientX
                this.prevMouse.y = e.clientY
            }

            // Always allow camera movement
            this.orbit.azimuth -= deltaX * 0.01
            this.targetAzimuth = this.orbit.azimuth
            this.orbit.polar -= deltaY * 0.01
            this.orbit.polar = Math.max(
                0.1,
                Math.min(Math.PI - 0.1, this.orbit.polar)
            )
            this.updateCameraPosition()

            // If both mouse buttons are held, make the cube rotate immediately with the camera
            if (this.mouseButtons.left && this.mouseButtons.right) {
                this.targetRotationY = this.orbit.azimuth
                this.cube.rotation.y = this.orbit.azimuth // Instantly sync cube rotation with camera
                this.movement.z = -0.1
            }
            // If only right mouse button is held, rotate the cube with the camera once past 90 degrees
            else if (this.mouseButtons.right && !this.mouseButtons.left) {
                // Calculate the difference between camera azimuth and cube rotation
                let diff = Math.abs(
                    ((this.orbit.azimuth - this.cube.rotation.y + Math.PI) %
                        (2 * Math.PI)) -
                    Math.PI
                )
                // If the difference is greater than 90 degrees (PI/2), rotate the cube with the camera
                if (diff > Math.PI / 2) {
                    this.targetRotationY = this.orbit.azimuth
                }
            }
        })

        // Add scroll wheel zoom for camera
        this.renderer.domElement.addEventListener(
            "wheel",
            (e) => {
                e.preventDefault()
                // Zoom in/out by changing the orbit radius
                const zoomSpeed = 0.5
                this.orbit.radius += e.deltaY * 0.01 * zoomSpeed
                this.orbit.radius = Math.max(2, Math.min(50, this.orbit.radius)) // Clamp zoom
                this.updateCameraPosition()
            },
            { passive: false }
        )

        // Prevent default right-click context menu on the renderer
        this.renderer.domElement.addEventListener("contextmenu", (e) =>
            e.preventDefault()
        )
    }

    updateCameraPosition() {
        if (!this.cube) return
        // Spherical to Cartesian conversion
        const { azimuth, polar, radius } = this.orbit
        const x =
            this.cube.position.x + radius * Math.sin(polar) * Math.sin(azimuth)
        const y = this.cube.position.y + radius * Math.cos(polar)
        const z =
            this.cube.position.z + radius * Math.sin(polar) * Math.cos(azimuth)
        this.camera.position.set(x, y, z)
        this.camera.lookAt(this.cube.position)
    }

    animate() {
        requestAnimationFrame(() => this.animate())

        if (this.cube) {
            // Continuous rotation if movement.y is set
            if (this.movement.y !== 0) {
                this.targetRotationY += this.movement.y
                this.targetAzimuth += this.movement.y
            }

            // Smoothly interpolate rotation
            this.cube.rotation.y +=
                (this.targetRotationY - this.cube.rotation.y) * this.rotationLerpSpeed

            // Smoothly interpolate camera azimuth
            this.orbit.azimuth +=
                (this.targetAzimuth - this.orbit.azimuth) * this.rotationLerpSpeed

            // Move forward/backward based on cube's facing direction
            if (this.movement.z !== 0) {
                const angle = this.cube.rotation.y
                this.cube.position.x += Math.sin(angle) * this.movement.z * 3 // Triple speed
                this.cube.position.z += Math.cos(angle) * this.movement.z * 3 // Triple speed
            }

            // Strafe left/right relative to cube's facing direction
            if (this.movement.x !== 0) {
                const angle = this.cube.rotation.y - Math.PI / 2
                this.cube.position.x += Math.sin(angle) * this.movement.x * 3 // Triple speed
                this.cube.position.z += Math.cos(angle) * this.movement.x * 3 // Triple speed
            }

            // Handle jumping and gravity
            if (this.isJumping) {
                this.cube.position.y += this.jumpVelocity
                this.cube.position.x += this.jumpHorizontal.x
                this.cube.position.z += this.jumpHorizontal.z
                this.jumpVelocity += this.gravity

                // --- Terrain collision using quadtree terrain map ---
                if (this.floor && typeof this.floor.getHeightAt === "function") {
                    const terrainY =
                        this.floor.getHeightAt(this.cube.position.x, this.cube.position.z) +
                        0.5
                    if (this.cube.position.y <= terrainY) {
                        this.cube.position.y = terrainY
                        this.isJumping = false
                        this.canDoubleJump = false // Reset double jump on landing
                        this.jumpVelocity = 0
                        this.jumpHorizontal.x = 0
                        this.jumpHorizontal.z = 0
                    }
                } else if (this.cube.position.y <= 0.5) {
                    // Fallback if no terrain
                    this.cube.position.y = 0.5
                    this.isJumping = false
                    this.canDoubleJump = false
                    this.jumpVelocity = 0
                    this.jumpHorizontal.x = 0
                    this.jumpHorizontal.z = 0
                }
            } else if (this.floor && typeof this.floor.getHeightAt === "function") {
                // --- Always snap cube to terrain when not jumping ---
                const terrainY =
                    this.floor.getHeightAt(this.cube.position.x, this.cube.position.z) + 0.5
                this.cube.position.y = terrainY
            } else if (this.cube.position.y < 0.5) {
                this.cube.position.y = 0.5
            }

            // --- Collision detection between cube and nearby box ---
            if (this.nearbyBox) {
                const cubeBox = new THREE.Box3().setFromObject(this.cube)
                const otherBox = new THREE.Box3().setFromObject(this.nearbyBox)

                if (cubeBox.intersectsBox(otherBox)) {
                    // Check vertical overlap
                    const cubeBottom = this.cube.position.y - 0.5
                    const cubeTop = this.cube.position.y + 0.5
                    const boxBottom = this.nearbyBox.position.y - 0.5
                    const boxTop = this.nearbyBox.position.y + 0.5

                    // If the cube is falling onto the box (from above)
                    if (
                        this.jumpVelocity <= 0 && // falling
                        cubeBottom < boxTop &&
                        cubeTop > boxTop && // cube is above box
                        Math.abs(this.cube.position.x - this.nearbyBox.position.x) < 0.9 &&
                        Math.abs(this.cube.position.z - this.nearbyBox.position.z) < 0.9
                    ) {
                        // Snap cube to top of box
                        this.cube.position.y = boxTop + 0.5
                        this.isJumping = false
                        this.canDoubleJump = false
                        this.jumpVelocity = 0
                        this.jumpHorizontal.x = 0
                        this.jumpHorizontal.z = 0
                    } else {
                        // Otherwise, block horizontal movement as before
                        if (this.movement.z !== 0) {
                            const angle = this.cube.rotation.y
                            this.cube.position.x -= Math.sin(angle) * this.movement.z
                            this.cube.position.z -= Math.cos(angle) * this.movement.z
                        }
                        if (this.movement.x !== 0) {
                            const angle = this.cube.rotation.y - Math.PI / 2
                            this.cube.position.x -= Math.sin(angle) * this.movement.x
                            this.cube.position.z -= Math.cos(angle) * this.movement.x
                        }
                        // Prevent moving into the box while jumping horizontally
                        if (this.isJumping) {
                            this.cube.position.x -= this.jumpHorizontal.x
                            this.cube.position.z -= this.jumpHorizontal.z
                        }
                    }
                }
            }
            // --- end collision detection ---

            // Reset cube to original start position if it falls below y = 1000
            if (this.cube && this.cube.position.y < -200) {
                this.cube.position.set(0, 0.5, 0)
                this.cube.rotation.set(0, 0, 0)
                this.isJumping = false
                this.canDoubleJump = false
                this.jumpVelocity = 0
                this.jumpHorizontal.x = 0
                this.jumpHorizontal.z = 0
                this.targetRotationY = 0
                this.targetAzimuth = 0
            }

            // Update position display
            const { x, y, z } = this.cube.position
            this.positionDiv.textContent = `Cube Position: x=${x.toFixed(
                2
            )}, y=${y.toFixed(2)}, z=${z.toFixed(2)}`

            // Always update camera to follow the cube
            this.updateCameraPosition()
        }

        // Update floor LOD based on camera position
        if (this.floor && this.floor.updateLOD) {
            this.floor.updateLOD(this.camera)
        }

        this.render()
    }

    render() {
        this.renderer.render(this.scene, this.camera)
    }
}

export default Scene
