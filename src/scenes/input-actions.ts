import { Player } from "@/entities/player"
import { UseCameraType } from "./camera"
import { ActiveKeys, KeyBindings } from "@/controllers/keys"

export const updateInputActions = (camera: UseCameraType, player: Player) => {
  if (
    !ActiveKeys[KeyBindings.MOUSEDOWNLEFT] ||
    !ActiveKeys[KeyBindings.MOUSEDOWNRIGHT]
  ) {
    player.setMovement("z", 0)
    return
  }

  if (
    ActiveKeys[KeyBindings.MOUSEDOWNLEFT] &&
    ActiveKeys[KeyBindings.MOUSEDOWNRIGHT]
  ) {
    // this.targetRotationY = this.orbit.azimuth
    player.rotation.y = camera.orbit.azimuth // Instantly sync cube rotation with camera
    player.setMovement("z", player.movementSpeed)
  }
}

/**
 *       switch (event.key) {
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
 */
/**
 *       switch (event.key) {
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
 */
