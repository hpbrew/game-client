import * as THREE from "three"
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js"

export class Player extends THREE.Group {
    constructor() {
        super()
        this.isJumping = false
        this.canDoubleJump = false
        this.jumpVelocity = 0
        this.gravity = -0.01
        this.jumpHorizontal = { x: 0, z: 0 }
        this.movement = { x: 0, y: 0, z: 0 }

        // Load FBX model
        const loader = new FBXLoader()
        loader.load(
            "/models/castle_guard_01.fbx",
            (fbx) => {
                fbx.scale.set(0.01, 0.01, 0.01)
                // Force all mesh materials to a visible color for debugging
                fbx.traverse((child) => {
                    if (child.isMesh) {
                        child.material.color.set(0xcccccc)
                        child.material.needsUpdate = true
                    }
                })
                this.add(fbx)
            },
            undefined,
            (error) => {
                console.error("Error loading FBX:", error)
            }
        )

        this.position.y = 0.5
    }

    setMovement(axis, value) {
        this.movement[axis] = value
    }

    startJump(angle, movement) {
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

    applyJump() {
        if (this.isJumping) {
            this.position.y += this.jumpVelocity
            this.position.x += this.jumpHorizontal.x
            this.position.z += this.jumpHorizontal.z
            this.jumpVelocity += this.gravity
        }
    }

    resetJump() {
        this.isJumping = false
        this.canDoubleJump = false
        this.jumpVelocity = 0
        this.jumpHorizontal.x = 0
        this.jumpHorizontal.z = 0
    }
}