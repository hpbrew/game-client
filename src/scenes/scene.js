import * as THREE from "three"
import WebGPURenderer from "three/addons/renderers/webgpu/WebGPURenderer.js"
import { Player } from "../objects/player"
import { createNearbyBox } from "../objects/nearbyBox"
import { QuadtreeFloor } from "../objects/quadtreeFloor"
import { TerrainChunkManager } from "../entities/terrain"
import { GUI } from "dat.gui"
// import { entity } from "../entities/entity"
// import { entity_manager } from "../entities/entity-manager"
// import { threejs_component } from "../entities/threejs_component"

class Scene {
  constructor() {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    // Defer renderer creation until init so we can async-init WebGPU when available.
    this.preferWebGPU = typeof navigator !== "undefined" && !!navigator.gpu
    this.renderer = null
    this.isWebGPU = false

    window.addEventListener(
      "resize",
      () => {
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(window.innerWidth, window.innerHeight)
      },
      false
    )
    // this.entityManager_ = new entity_manager.EntityManager()
    // Use the new Player class
    this.player = new Player()
    this.scene.add(this.player)

    // this.terrain = null // Renamed from floor
    this.nearbyBox = null // Store reference to the nearby box
    this.isJumping = false
    this.canDoubleJump = false
    this.jumpVelocity = 0
    this.gravity = -0.01

    // Add for jump movement
    this.jumpHorizontal = { x: 0, z: 0 }

    // Camera orbit controls state
    this.isDragging = false
    this.prevMouse = { x: 0, y: 0 }
    this.orbit = { azimuth: 0, polar: Math.PI / 4, radius: 8 } // Camera spherical coords
    this.targetAzimuth = this.orbit.azimuth // Add this line

    // Camera target offset (so we look at player's head/center instead of feet)
    this.cameraTargetOffset = new THREE.Vector3(0, 1, 0)

    // For smooth rotation
    this.targetRotationY = 0
    this.rotationLerpSpeed = 0.15

    this.mouseButtons = { left: false, right: false } // Track mouse button states

    const guiParams = {
      general: {},
    }
    const gui = new GUI()
    gui.addFolder("General")
    gui.close()

    // TerrainChunkManager will be created during init() after renderer is available
    this.terrainChunkManager = null
    this.guiParams = guiParams
    this.gui = gui

    // this.terrainChunkManager = new QuadtreeFloor({
    //   worldSize: 400, // Make the terrain large
    //   minTileSize: 64, // Each tile is 10x10 units
    //   maxSegments: 64, // Highest LOD segments per tile
    //   minSegments: 16, // Lowest LOD segments per tile
    //   lodDistances: [20, 40, 80, 160], // LOD switch distances
    //   caves: [{ x: 20, z: 20, radius: 16, depth: 16, falloff: 0.5 }],
    // })
    // this.scene.add(this.terrainChunkManager)
    // const floors = new Map()
    // const f1 = new QuadtreeFloor({
    //   worldSize: 40, // Make the terrain large
    //   minTileSize: 64, // Each tile is 10x10 units
    //   maxSegments: 64, // Highest LOD segments per tile
    //   minSegments: 16, // Lowest LOD segments per tile
    //   lodDistances: [20, 40, 80, 160], // LOD switch distances
    //   caves: [{ x: 0, z: 0, radius: 16, depth: -16, falloff: 0.5 }],
    // })
    // floors.set("f1", f1)
    // this.scene.add(f1)

    // Create a div for displaying player position and FPS
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

    // FPS counter state
    this.lastFrameTime = performance.now()
    this.fps = 0
  }

  async init() {
    // Create renderer: prefer WebGPU when available
    // try {
    //   if (this.preferWebGPU) {
    //     this.renderer = new WebGPURenderer({ antialias: true })
    //     // WebGPURenderer requires async initialization
    //     if (this.renderer.init) await this.renderer.init()
    //     this.isWebGPU = true
    //   }
    // } catch (err) {
    //   console.warn("WebGPU init failed, falling back to WebGL:", err)
    //   this.renderer = null
    //   this.isWebGPU = false
    // }

    if (!this.renderer) {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
      this.renderer.shadowMap.enabled = true
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    }

    // Common renderer setup
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    if (this.renderer.outputEncoding !== undefined)
      this.renderer.outputEncoding = THREE.sRGBEncoding
    this.renderer.setPixelRatio(window.devicePixelRatio || 1)

    this.renderer.gammaFactor = 2.2

    document.body.appendChild(this.renderer.domElement)

    // Some renderers expose a domElement, ensure it's added
    if (this.renderer.domElement && !this.renderer.domElement.parentElement) {
      document.body.appendChild(this.renderer.domElement)
    }

    console.log("Renderer in use:", this.isWebGPU ? "WebGPU" : "WebGL")

    // Now that renderer exists, create the TerrainChunkManager
    this.terrainChunkManager = new TerrainChunkManager({
      scene: this.scene,
      target: this.player,
      gui: this.gui,
      guiParams: this.guiParams,
      threejs: this.renderer,
    })

    this.addObjects()
    this.addEventListeners()
    this.animate()
  }

  addObjects() {
    // const threejs = new entity.Entity()
    // threejs.AddComponent(new threejs_component.ThreeJSController())
    // this.entityManager_.Add(threejs)

    // const threejs_ = threejs.GetComponent("ThreeJSController").threejs_

    // this.scene.add(terrainChunkManager)
    // this.terrain = new QuadtreeFloor({
    //   worldSize: 400, // Make the terrain large
    //   minTileSize: 64, // Each tile is 10x10 units
    //   maxSegments: 64, // Highest LOD segments per tile
    //   minSegments: 16, // Lowest LOD segments per tile
    //   lodDistances: [20, 40, 80, 160], // LOD switch distances
    // })
    // this.scene.add(this.terrain)

    this.nearbyBox = createNearbyBox(this.terrainChunkManager)
    this.scene.add(this.nearbyBox)

    this.targetRotationY = this.player.rotation.y
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
    frontBlueCircle.position.set(0, 0, 0.501)
    this.player.add(frontBlueCircle)

    // Add lighting for FBX models
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
    this.scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
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
    this.scene.add(directionalLight)

    // directionalLight = new THREE.AmbientLight(0xFFFFFF, 0.25);
    // this.scene.add(directionalLight);
  }

  addEventListeners() {
    window.addEventListener("pointerdown", (e) => {
      if (!e.shiftKey) return

      const pos = this.terrainChunkManager?.raycastSelect(e, this.camera)
      if (!pos) return
      console.log("Clicked terrain at ", pos)
      this.player.position.set(pos.x, pos.y + 0.1, pos.z)
    })
    window.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "ArrowUp":
        case "w":
        case "W":
          this.player.setMovement("z", 0.1)
          break
        case "ArrowDown":
        case "s":
        case "S":
          this.player.setMovement("z", -0.1)
          break
        case "ArrowLeft":
        case "a":
        case "A":
          this.player.setMovement("y", 0.045) // Start rotating left (slower)
          break
        case "ArrowRight":
        case "d":
        case "D":
          this.player.setMovement("y", -0.045) // Start rotating right (slower)
          break
        case " ":
          this.player.startJump(this.player.rotation.y, this.player.movement)
          break
        case "q":
        case "Q":
          this.player.setMovement("x", -0.1)
          break
        case "e":
        case "E":
          this.player.setMovement("x", 0.1)
          break
        case "c":
        case "C":
          this.player.setMovement("x", -0.1) // Strafe left
          break
        case "v":
        case "V":
          this.player.setMovement("x", 0.1) // Strafe right
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
          this.player.setMovement("z", 0)
          break
        case "ArrowLeft":
        case "a":
        case "A":
        case "ArrowRight":
        case "d":
        case "D":
          this.player.setMovement("y", 0) // Stop rotating
          break
        case "q":
        case "Q":
        case "e":
        case "E":
          this.player.setMovement("x", 0)
          break
        case "c":
        case "C":
        case "v":
        case "V":
          this.player.setMovement("x", 0) // Stop strafing
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
      this.player.setMovement("z", 0)

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
        this.player.rotation.y = this.orbit.azimuth // Instantly sync cube rotation with camera
        this.player.setMovement("z", 0.1)
      }
      // If only right mouse button is held, rotate the cube with the camera once past 90 degrees
      else if (this.mouseButtons.right && !this.mouseButtons.left) {
        // Calculate the difference between camera azimuth and cube rotation
        let diff = Math.abs(
          ((this.orbit.azimuth - this.player.rotation.y + Math.PI) %
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

    // Touch pinch-to-zoom support for mobile: two-finger pinch to zoom
    this._touchZoom = {
      active: false,
      startDist: 0,
      lastDist: 0,
    }

    this.renderer.domElement.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches && e.touches.length === 2) {
          // Start pinch
          const dx = e.touches[0].clientX - e.touches[1].clientX
          const dy = e.touches[0].clientY - e.touches[1].clientY
          const dist = Math.hypot(dx, dy)
          this._touchZoom.active = true
          this._touchZoom.startDist = dist
          this._touchZoom.lastDist = dist
        } else if (e.touches && e.touches.length === 1) {
          // Begin single-touch orbit drag
          const t = e.touches[0]
          this.isDragging = true
          this.prevMouse.x = t.clientX
          this.prevMouse.y = t.clientY
        }
      },
      { passive: true }
    )

    // Double-tap detection state for moving player
    this._lastTap = { time: 0, x: 0, y: 0 }

    this.renderer.domElement.addEventListener(
      "touchmove",
      (e) => {
        // Prioritize pinch-to-zoom when active
        if (this._touchZoom.active) {
          if (e.touches && e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX
            const dy = e.touches[0].clientY - e.touches[1].clientY
            const dist = Math.hypot(dx, dy)

            // Calculate scale factor relative to last distance
            const delta = dist - this._touchZoom.lastDist

            // Tune sensitivity: convert pixel delta into radius change
            const pinchSpeed = 0.02
            this.orbit.radius -= delta * pinchSpeed // pinch together (dist decreases) => radius decreases (zoom in)
            this.orbit.radius = Math.max(2, Math.min(50, this.orbit.radius))
            this._touchZoom.lastDist = dist

            // Update camera immediately for responsive feel
            this.updateCameraPosition()

            // Prevent page scroll while pinching
            e.preventDefault()
          }
          return
        }

        // Single-touch orbit drag
        if (e.touches && e.touches.length === 1 && this.isDragging) {
          const t = e.touches[0]
          const deltaX = t.clientX - this.prevMouse.x
          const deltaY = t.clientY - this.prevMouse.y

          // Adjust sensitivity to feel similar to mouse dragging
          this.orbit.azimuth -= deltaX * 0.01
          this.targetAzimuth = this.orbit.azimuth
          this.orbit.polar -= deltaY * 0.01
          this.orbit.polar = Math.max(
            0.1,
            Math.min(Math.PI - 0.1, this.orbit.polar)
          )

          this.prevMouse.x = t.clientX
          this.prevMouse.y = t.clientY

          this.updateCameraPosition()
          e.preventDefault()
        }
      },
      { passive: false }
    )

    this.renderer.domElement.addEventListener(
      "touchend",
      (e) => {
        // End pinch when less than two touches remain
        if (!e.touches || e.touches.length < 2) {
          this._touchZoom.active = false
          this._touchZoom.startDist = 0
          this._touchZoom.lastDist = 0
        }

        // End single-touch drag when no touches remain
        if (!e.touches || e.touches.length === 0) {
          this.isDragging = false
        }

        // Double-tap detection: if a quick second tap occurs near the first, move player
        try {
          const now = performance.now()
          // Use changedTouches if present to get the last touch that ended
          const touch =
            (e.changedTouches && e.changedTouches[0]) ||
            (e.touches && e.touches[0])
          if (touch) {
            const dt = now - this._lastTap.time
            const dx = touch.clientX - this._lastTap.x
            const dy = touch.clientY - this._lastTap.y
            const dist = Math.hypot(dx, dy)
            const DOUBLE_TAP_MAX_MS = 300
            const DOUBLE_TAP_MAX_DIST = 30 // pixels
            if (
              dt > 0 &&
              dt <= DOUBLE_TAP_MAX_MS &&
              dist <= DOUBLE_TAP_MAX_DIST
            ) {
              // It's a double-tap: perform raycast and move player
              const rect = this.renderer.domElement.getBoundingClientRect()
              // Convert touch coords to client coords
              const clientX = touch.clientX - rect.left
              const clientY = touch.clientY - rect.top
              const fakeEvent = {
                clientX: touch.clientX,
                clientY: touch.clientY,
              }
              const pos = this.terrainChunkManager?.raycastSelect(
                fakeEvent,
                this.camera
              )
              if (pos) {
                console.log("Double-tap move to", pos)
                this.player.position.set(pos.x, pos.y + 0.1, pos.z)
              }
            }

            // store last tap info
            this._lastTap.time = now
            this._lastTap.x = touch.clientX
            this._lastTap.y = touch.clientY
          }
        } catch (err) {
          // ignore
        }
      },
      { passive: true }
    )

    // Prevent default right-click context menu on the renderer
    this.renderer.domElement.addEventListener("contextmenu", (e) =>
      e.preventDefault()
    )
  }

  updateCameraPosition() {
    if (!this.player) return
    // Spherical to Cartesian conversion
    const { azimuth, polar, radius } = this.orbit

    // Invert the azimuth to move the camera to the opposite side of the player
    const oppositeAzimuth = azimuth + Math.PI

    const x =
      this.player.position.x +
      radius * Math.sin(polar) * Math.sin(oppositeAzimuth)
    let y = this.player.position.y + radius * Math.cos(polar)
    const z =
      this.player.position.z +
      radius * Math.sin(polar) * Math.cos(oppositeAzimuth)

    // Compute the actual target we want the camera to look at (player + offset)
    const target = new THREE.Vector3()
    target.copy(this.player.position).add(this.cameraTargetOffset)

    // Prevent camera from going below the terrain relative to the target
    if (
      this.terrainChunkManager &&
      typeof this.terrainChunkManager.getHeightAt === "function"
    ) {
      const terrainY = this.terrainChunkManager.getHeightAt(x, z) + 0.2 // small offset above ground
      if (y < terrainY) y = terrainY
    }

    this.camera.position.set(x, y, z)
    this.camera.lookAt(target)
  }

  animate() {
    requestAnimationFrame(() => this.animate())

    // FPS calculation
    const now = performance.now()
    const delta = now - this.lastFrameTime
    this.fps = 1000 / delta
    this.lastFrameTime = now

    // update player animations (delta in seconds)
    if (this.player && typeof this.player.update === "function") {
      this.player.update(delta / 1000)
    }

    if (
      this.terrainChunkManager &&
      typeof this.terrainChunkManager.Update === "function"
    ) {
      this.terrainChunkManager.Update(delta / 1000)
    }
    if (this.player) {
      // Continuous rotation if movement.y is set
      if (this.player.movement.y !== 0) {
        this.targetRotationY += this.player.movement.y
        this.targetAzimuth += this.player.movement.y
      }

      // Smoothly interpolate rotation
      this.player.rotation.y +=
        (this.targetRotationY - this.player.rotation.y) * this.rotationLerpSpeed

      // Smoothly interpolate camera azimuth
      this.orbit.azimuth +=
        (this.targetAzimuth - this.orbit.azimuth) * this.rotationLerpSpeed

      // Move forward/backward based on cube's facing direction
      if (this.player.movement.z !== 0) {
        const angle = this.player.rotation.y
        this.player.position.x += Math.sin(angle) * this.player.movement.z * 3 // Triple speed
        this.player.position.z += Math.cos(angle) * this.player.movement.z * 3 // Triple speed
      }

      // Strafe left/right relative to cube's facing direction
      if (this.player.movement.x !== 0) {
        const angle = this.player.rotation.y - Math.PI / 2
        this.player.position.x += Math.sin(angle) * this.player.movement.x * 3 // Triple speed
        this.player.position.z += Math.cos(angle) * this.player.movement.x * 3 // Triple speed
      }

      // Handle jumping and gravity
      this.player.applyJump()
      const overlapValue = 0.01
      // --- Terrain collision using quadtree terrain map ---
      if (this.player.isJumping) {
        if (
          this.terrainChunkManager &&
          typeof this.terrainChunkManager.getHeightAt === "function"
        ) {
          const terrainY =
            this.terrainChunkManager.getHeightAt(
              this.player.position.x,
              this.player.position.z
            ) + overlapValue
          if (this.player.position.y <= terrainY) {
            this.player.position.y = terrainY
            this.player.resetJump()
          }
        } else if (this.player.position.y <= overlapValue) {
          this.player.position.y = overlapValue
          this.player.resetJump()
        }
      } else if (
        this.terrainChunkManager &&
        typeof this.terrainChunkManager.getHeightAt === "function"
      ) {
        const terrainY =
          this.terrainChunkManager.getHeightAt(
            this.player.position.x,
            this.player.position.z
          ) + overlapValue
        this.player.position.y = terrainY
      } else if (this.player.position.y < overlapValue) {
        this.player.position.y = overlapValue
      }

      // --- Collision detection between cube and nearby box ---
      if (this.nearbyBox) {
        const playerBox = new THREE.Box3().setFromObject(this.player)
        const otherBox = new THREE.Box3().setFromObject(this.nearbyBox)

        if (playerBox.intersectsBox(otherBox)) {
          // Check vertical overlap
          const playerBottom = this.player.position.y - overlapValue
          const playerTop = this.player.position.y + overlapValue
          const boxBottom = this.nearbyBox.position.y - overlapValue
          const boxTop =
            this.nearbyBox.position.y +
            this.nearbyBox.geometry.parameters.height

          // If the cube is falling onto the box (from above)
          if (
            this.jumpVelocity <= 0 && // falling
            playerBottom < boxTop &&
            playerTop > boxTop && // cube is above box
            Math.abs(this.player.position.x - this.nearbyBox.position.x) <
              overlapValue &&
            Math.abs(this.player.position.z - this.nearbyBox.position.z) <
              overlapValue
          ) {
            // Snap cube to top of box
            this.player.position.y = boxTop + overlapValue
            this.isJumping = false
            this.canDoubleJump = false
            this.jumpVelocity = 0
            this.jumpHorizontal.x = 0
            this.jumpHorizontal.z = 0
          } else {
            // Otherwise, block horizontal movement as before
            if (this.player.movement.z !== 0) {
              const angle = this.player.rotation.y
              this.player.position.x -= Math.sin(angle) * this.player.movement.z
              this.player.position.z -= Math.cos(angle) * this.player.movement.z
            }
            if (this.player.movement.x !== 0) {
              const angle = this.player.rotation.y - Math.PI / 2
              this.player.position.x -= Math.sin(angle) * this.player.movement.x
              this.player.position.z -= Math.cos(angle) * this.player.movement.x
            }
            // Prevent moving into the box while jumping horizontally
            if (this.isJumping) {
              this.player.position.x -= this.jumpHorizontal.x
              this.player.position.z -= this.jumpHorizontal.z
            }
          }
        }
      }
      // --- end collision detection ---

      // Reset cube to original start position if it falls below y = 1000
      if (this.player && this.player.position.y < -200) {
        this.player.position.set(0, 0.5, 0)
        this.player.rotation.set(0, 0, 0)
        this.isJumping = false
        this.canDoubleJump = false
        this.jumpVelocity = 0
        this.jumpHorizontal.x = 0
        this.jumpHorizontal.z = 0
        this.targetRotationY = 0
        this.targetAzimuth = 0
      }

      // Update position and FPS display
      const { x, y, z } = this.player.position
      this.positionDiv.innerHTML =
        `FPS: ${this.fps.toFixed(1)}<br>` +
        `Player Position: x=${x.toFixed(2)}, y=${y.toFixed(2)}, z=${z.toFixed(
          2
        )}`

      // Always update camera to follow the player
      this.updateCameraPosition()
    }

    // Update terrain LOD based on camera position
    // if (this.terrain && this.terrain.updateLOD) {
    //   this.terrain.updateLOD(this.camera)
    // }

    this.render()
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }
}

export default Scene
