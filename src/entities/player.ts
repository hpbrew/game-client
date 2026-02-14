import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

type ActionName = 'idle' | 'run' | 'dance' | 'death' | 'walk' | 'attack'

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

  constructor() {
    super()
    // Movement / jump state
    this.isJumping = false
    this.canDoubleJump = false
    this.jumpVelocity = 0
    this.gravity = -0.01
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
    this._activeActionName = 'idle'

    // Load GLB model (guard.glb)
    const loader = new GLTFLoader()
    const url = `${import.meta.env.BASE_URL
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
          const findClip = (re: RegExp) => gltf.animations.find((a) => re.test(a.name))

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
      }
    )
  }

  setMovement(axis: 'x' | 'y' | 'z', value: number) {
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
        this.jumpHorizontal.z
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

    // fade out current
    if (this._activeActionName && this.actions[this._activeActionName]) {
      try {
        this.actions[this._activeActionName]?.fadeOut(fadeDuration)
      } catch (e) {
        this.actions[this._activeActionName]?.stop &&
          this.actions[this._activeActionName]?.stop()
      }
    }

    // fade in next
    next.reset()
    next.fadeIn(fadeDuration)
    next.play()
    this._activeActionName = name
  }

  sampleTerrainHeight(terrainChunkManager: any) {
    const overlapValue = 0.01

    const terrainY =
      terrainChunkManager?.getHeightAt(
        this.position.x,
        this.position.z
      ) + overlapValue
    if (!isNaN(terrainY)) this.position.setY(terrainY)
  }

  update(deltaSeconds: number) {
    // update animation mixer if present
    if (this.mixer) {
      this.mixer.update(deltaSeconds)
    }

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
}
