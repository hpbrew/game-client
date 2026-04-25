import { KeyMapperType } from "@/controllers/keys"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

type ActionName = "idle" | "run" | "dance" | "death" | "walk" | "attack"

export class Player extends THREE.Group {
  // Typed properties
  isJumping: boolean
  canDoubleJump: boolean
  jumpVelocity: number
  gravity: number
  jumpHorizontal: { x: number; z: number }
  movement: { x: number; y: number; z: number }
  model: THREE.Object3D | null
  mixer: THREE.AnimationMixer | null
  actions: {
    idle: THREE.AnimationAction | null
    run: THREE.AnimationAction | null
    dance: THREE.AnimationAction | null
    death: THREE.AnimationAction | null
    walk: THREE.AnimationAction | null
    attack: THREE.AnimationAction | null
  }
  _activeActionName: ActionName
  movementSpeed: number
  turnSpeed: number

  constructor() {
    super()
    // Movement / jump state
    this.isJumping = false
    this.canDoubleJump = false
    this.jumpVelocity = 0
    this.gravity = -0.01
    this.movementSpeed = 5
    this.turnSpeed = 5
    this.jumpHorizontal = { x: 0, z: 0 }
    this.movement = { x: 0, y: 0, z: 0 }

    this.model = null
    this.mixer = null

    this.actions = {
      idle: null,
      run: null,
      dance: null,
      death: null,
      walk: null,
      attack: null,
    }
    this._activeActionName = "idle"

    // Load GLB model (guard.glb)
    const loader = new GLTFLoader()
    const url = `${
      import.meta.env.BASE_URL
    }not_my_resources/characters/guard.glb`
    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene || gltf.scenes?.[0]
        if (!model) return

        // Ensure visible materials for debugging and enable shadows
        // model.traverse((child) => {
        //   if (child.isMesh) {
        //     child.castShadow = true
        //     child.receiveShadow = true
        //     if (child.material) {
        //       if (!("map" in child.material) || !child.material.map) {
        //         child.material = new THREE.MeshStandardMaterial({
        //           color: 0xcccccc,
        //         })
        //       }
        //       child.material.needsUpdate = true
        //     } else {
        //       child.material = new THREE.MeshStandardMaterial({
        //         color: 0xcccccc,
        //       })
        //     }
        //   }
        // })

        this.model = model
        this.add(model)

        // Animation setup: create mixer and prepare idle/run actions
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(model)
          const findClip = (re: RegExp) =>
            gltf.animations.find((a) => re.test(a.name))

          // prefer explicit names, fallback to sensible alternatives
          const idleClip =
            findClip(/idle/i) || findClip(/stand|rest/i) || gltf.animations[0]
          const runClip =
            findClip(/run/i) || findClip(/walk/i) || gltf.animations[0]
          const danceClip = findClip(/dance/i) || gltf.animations[0]
          const deathClip = findClip(/death|die/i) || gltf.animations[0]
          const attackClip = findClip(/attack|hit/i) || gltf.animations[0]
          const walkClip = findClip(/walk/i) || gltf.animations[0]

          this.actions.dance = danceClip
            ? this.mixer.clipAction(danceClip)
            : null
          this.actions.death = deathClip
            ? this.mixer.clipAction(deathClip)
            : null
          this.actions.attack = attackClip
            ? this.mixer.clipAction(attackClip)
            : null
          this.actions.walk = walkClip ? this.mixer.clipAction(walkClip) : null
          this.actions.idle = idleClip ? this.mixer.clipAction(idleClip) : null
          this.actions.run = runClip ? this.mixer.clipAction(runClip) : null

          // Ensure actions exist and are looped
          if (this.actions.idle) {
            this.actions.idle.reset()
            this.actions.idle.play()
            this._activeActionName = "idle"
          }
          if (this.actions.run) {
            this.actions.run.loop = THREE.LoopRepeat
          }
        }
      },
      undefined,
      (err) => {
        console.error("Failed to load guard.glb:", err)
      },
    )
  }

  setMovement(axis: "x" | "y" | "z", value: number) {
    this.movement[axis] = value
  }

  startJump(angle: number, movement: { x: number; y: number; z: number }) {
    if (!this.isJumping) {
      this.isJumping = true
      this.canDoubleJump = true
      this.jumpVelocity = 0.2
      this.jumpHorizontal.x =
        Math.sin(angle) * movement.z +
        Math.sin(angle - Math.PI / 2) * movement.x
      this.jumpHorizontal.z =
        Math.cos(angle) * movement.z +
        Math.cos(angle - Math.PI / 2) * movement.x
    } else if (this.canDoubleJump) {
      this.jumpVelocity = 0.2
      this.jumpHorizontal.x =
        Math.sin(angle) * movement.z +
        Math.sin(angle - Math.PI / 2) * movement.x
      this.jumpHorizontal.z =
        Math.cos(angle) * movement.z +
        Math.cos(angle - Math.PI / 2) * movement.x
      this.canDoubleJump = false
    }
  }

  applyJump(deltaSeconds: number) {
    if (this.isJumping) {
      const v = new THREE.Vector3(
        this.jumpHorizontal.x,
        this.jumpVelocity,
        this.jumpHorizontal.z,
      )
      this.position.addScaledVector(v, deltaSeconds)
      this.jumpVelocity += this.gravity * deltaSeconds
    }
  }

  resetJump() {
    this.isJumping = false
    this.canDoubleJump = false
    this.jumpVelocity = 0
    this.jumpHorizontal.x = 0
    this.jumpHorizontal.z = 0
  }

  // switch animations with a short crossfade
  setAction(name: ActionName) {
    if (!this.mixer) return
    if (this._activeActionName === name) return

    const fadeDuration = 0.2

    const next = this.actions[name]
    if (!next) return

    const previousName = this._activeActionName
    const previousAction = previousName ? this.actions[previousName] : null

    // fade out previous action (if different)
    if (previousAction && previousAction !== next) {
      try {
        previousAction.fadeOut(fadeDuration)
      } catch (e) {
        previousAction.stop && previousAction.stop()
      }
    }

    // mark new active action
    this._activeActionName = name

    // fade in next
    next.reset()
    next.fadeIn(fadeDuration)
    next.play()

    console.log(`Switched to action: ${name}`)
  }

  sampleTerrainHeight(terrainChunkManager: any) {
    const overlapValue = 0.01

    const terrainY =
      terrainChunkManager?.getHeightAt(this.position.x, this.position.z) +
      overlapValue
    if (!isNaN(terrainY)) this.position.setY(terrainY)
  }

  determineAnimationState() {
    // decide which animation to play:
    // when moving on x or y use "run", otherwise "idle"
    const moving =
      Math.abs(this.movement.x) > 0.0005 ||
      Math.abs(this.movement.y) > 0.0005 ||
      Math.abs(this.movement.z) > 0.0005

    // Idle, Walk, Run, Death, Attack, Dance
    if (moving) {
      this.setAction("run")
    } else {
      this.setAction("idle")
    }
  }

  update(
    delta: number,
    keyMapper: KeyMapperType,
    positionHeightChecker: (position: THREE.Vector3) => number = (
      position: THREE.Vector3,
    ) => position.y,
  ) {
    // update animation mixer if present
    if (this.mixer) {
      this.mixer.update(delta)
    }

    this.onInputs(delta, keyMapper)

    const height = positionHeightChecker(this.position)

    // set player to this terrain height unless they are above it (jumping)
    this.position.y = height

    // this.determineAnimationState()
  }

  move(delta: number, x: number, z: number) {
    const direction = new THREE.Vector3(x, 0, z)

    if (direction.lengthSq() === 0) return

    direction.normalize()
    console.log("Moving in direction:", direction)
    console.log("Current position:", this.position)
    this.position.addScaledVector(direction, this.movementSpeed * delta)

    // Determine target rotation
    const targetAngle = Math.atan2(direction.x, direction.z)

    // Smooth rotation
    this.rotation.y = THREE.MathUtils.lerp(
      this.rotation.y,
      targetAngle,
      this.turnSpeed * delta,
    )

    // move the player in the direction they are facing
    // const angle = this.rotation.y
    // this.position.x += Math.sin(angle) * z * this.movementSpeed * delta
    // this.position.z += Math.cos(angle) * z * this.movementSpeed * delta
    // this.position.x += Math.sin(angle - Math.PI / 2) * x * this.movementSpeed * delta
    // this.position.z += Math.cos(angle - Math.PI / 2) * x * this.movementSpeed * delta
  }
  onInputs(delta: number, keyMapper: KeyMapperType) {
    // This can be used to trigger immediate reactions to input changes if needed

    const axis = keyMapper.getAxis()

    // If no movement input, skip processing
    if (!axis.x && !axis.z && !axis.y) {
      this.setAction("idle")
      return
    }

    // console.log(keyMapper.getActions())
    this.setAction("run")
    this.move(delta, axis.x, axis.z)

    // if () {
    //   const angle = this.player.rotation.y
    //   this.player.position.x += Math.sin(angle) * this.player.movement.z * 3 // Triple speed
    //   this.player.position.z += Math.cos(angle) * this.player.movement.z * 3 // Triple speed
    // }
    // if (
    //   ActiveKeys[KeyBindings.MOUSEDOWNLEFT] &&
    //   ActiveKeys[KeyBindings.MOUSEDOWNRIGHT]
    // ) {
    //   // instantly align the player with the camera and move forward
    //   player.rotation.y = camera.orbit.azimuth
    //   player.setMovement("z", player.movementSpeed)
    // }
    // const activeKeys = getActions()
    // const moveX = input.right - input.left
    // const moveZ = input.down - input.up
    // if (moveX !== 0 || moveZ !== 0) {
    //   const direction = new THREE.Vector3(moveX, 0, moveZ)
    //     .normalize()
    //     .multiplyScalar(speed * delta)
    //   player.position.add(direction)
    // }
    // if (ActiveKeys[KeyBindings.MOVE_FORWARD]) {
    //   player.setMovement("z", player.movementSpeed)
    //   return
    // } else if (ActiveKeys[KeyBindings.MOVE_BACKWARD]) {
    //   player.setMovement("z", -player.movementSpeed)
    //   return
    // }
  }
}
