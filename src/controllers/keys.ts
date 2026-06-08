export const useKeyMapper = () => {
  const KeyBindings = {
    MOVE_FORWARD: "KeyW",
    MOVE_BACKWARD: "KeyS",
    STRAFE_LEFT: "KeyQ",
    STRAFE_RIGHT: "KeyE",
    TURN_LEFT: "KeyA",
    TURN_RIGHT: "KeyD",

    // MOVE_LEFT: "KeyA",
    // MOVE_RIGHT: "KeyD",

    MOVE_FORWARD2: "ArrowUp",
    MOVE_BACKWARD2: "ArrowDown",
    STRAFE_LEFT2: "Num1",
    STRAFE_RIGHT2: "Num0",
    TURN_LEFT2: "ArrowLeft",
    TURN_RIGHT2: "ArrowRight",

    JUMP: "Space",

    // Mouse Down Events
    MOUSEDOWNLEFT: "Mouse0", // Left mouse button
    MOUSEDOWNMIDDLE: "Mouse1", // Middle mouse button
    MOUSEDOWNRIGHT: "Mouse2", // Right mouse button
  }

  type KeyBindingCode = (typeof KeyBindings)[keyof typeof KeyBindings]

  const ActiveKeys: Map<KeyBindingCode, boolean> = new Map()
  function isKeyActive(key: KeyBindingCode): boolean {
    return ActiveKeys.get(key) || false
  }

  function mouseHandler(event: MouseEvent, state: boolean) {
    if (event.button === 0) {
      ActiveKeys.set(KeyBindings.MOUSEDOWNLEFT, state)
    } else if (event.button === 1) {
      ActiveKeys.set(KeyBindings.MOUSEDOWNMIDDLE, state)
    } else if (event.button === 2) {
      ActiveKeys.set(KeyBindings.MOUSEDOWNRIGHT, state)
    }
  }

  function keyHandler(event: KeyboardEvent, state: boolean) {
    const code = event.code

    switch (code) {
      case KeyBindings.MOVE_FORWARD:
        ActiveKeys.set(KeyBindings.MOVE_FORWARD, state)
        break
      case KeyBindings.MOVE_BACKWARD:
        ActiveKeys.set(KeyBindings.MOVE_BACKWARD, state)
        break
      case KeyBindings.STRAFE_LEFT:
        ActiveKeys.set(KeyBindings.STRAFE_LEFT, state)
        break
      case KeyBindings.STRAFE_RIGHT:
        ActiveKeys.set(KeyBindings.STRAFE_RIGHT, state)
        break
      case KeyBindings.TURN_LEFT:
        ActiveKeys.set(KeyBindings.TURN_LEFT, state)
        break
      case KeyBindings.TURN_RIGHT:
        ActiveKeys.set(KeyBindings.TURN_RIGHT, state)
        break

      case KeyBindings.MOVE_FORWARD2:
        ActiveKeys.set(KeyBindings.MOVE_FORWARD2, state)
        break
      case KeyBindings.MOVE_BACKWARD2:
        ActiveKeys.set(KeyBindings.MOVE_BACKWARD2, state)
        break
      case KeyBindings.STRAFE_LEFT2:
        ActiveKeys.set(KeyBindings.STRAFE_LEFT2, state)
        break
      case KeyBindings.STRAFE_RIGHT2:
        ActiveKeys.set(KeyBindings.STRAFE_RIGHT2, state)
        break
      case KeyBindings.TURN_LEFT2:
        ActiveKeys.set(KeyBindings.TURN_LEFT2, state)
        break
      case KeyBindings.TURN_RIGHT2:
        ActiveKeys.set(KeyBindings.TURN_RIGHT2, state)
        break

      case KeyBindings.JUMP:
        ActiveKeys.set(KeyBindings.JUMP, state)
        break
      default:
        break
    }
  }

  function keyUpHandler(event: KeyboardEvent) {
    keyHandler(event, true)
  }

  function keyDownHandler(event: KeyboardEvent) {
    keyHandler(event, false)
  }

  const actions = {
    moveForward: () =>
      isKeyActive(KeyBindings.MOVE_BACKWARD) ||
      isKeyActive(KeyBindings.MOVE_BACKWARD2),
    moveBackward: () =>
      isKeyActive(KeyBindings.MOVE_FORWARD) ||
      isKeyActive(KeyBindings.MOVE_FORWARD2),
    strafeLeft: () =>
      isKeyActive(KeyBindings.STRAFE_RIGHT) ||
      isKeyActive(KeyBindings.STRAFE_RIGHT2),
    strafeRight: () =>
      isKeyActive(KeyBindings.STRAFE_LEFT) ||
      isKeyActive(KeyBindings.STRAFE_LEFT2),
    turnLeft: () =>
      isKeyActive(KeyBindings.TURN_LEFT) || isKeyActive(KeyBindings.TURN_LEFT2),
    turnRight: () =>
      isKeyActive(KeyBindings.TURN_RIGHT) ||
      isKeyActive(KeyBindings.TURN_RIGHT2),
    jump: () => isKeyActive(KeyBindings.JUMP),

    mouseLeft: () => isKeyActive(KeyBindings.MOUSEDOWNLEFT),
    mouseRight: () => isKeyActive(KeyBindings.MOUSEDOWNRIGHT),
  }

  /**
   * Action Map for Device -> Game Meaning
   * @param input
   * @returns
   */
  function getActions() {
    return {
      moveForward: actions.moveForward(),
      moveBackward: actions.moveBackward(),
      strafeLeft: actions.strafeLeft(),
      strafeRight: actions.strafeRight(),
      jump: actions.jump(),

      mouseLeft: actions.mouseLeft(),
      mouseRight: actions.mouseRight(),
    }
  }

  /**
   * Determine movement axis based on current active keys
   * @param cameraAzimuth - Optional camera azimuth for mouse button movement
   * @returns {x: number, z: number}
   */
  function getAxis(cameraAzimuth?: number) {
    let x = 0
    let z = 0
    let y = 0

    // If both mouse buttons are down, move in camera direction
    if (
      actions.mouseLeft() &&
      actions.mouseRight() &&
      cameraAzimuth !== undefined
    ) {
      // Add Math.PI to face the direction the camera is looking (opposite of camera position)
      const lookDirection = cameraAzimuth
      x = Math.sin(lookDirection) * -1 // Invert x to move in the direction the camera is looking
      z = Math.cos(lookDirection)

      return { x, z, y: lookDirection }
    }

    if (actions.moveForward()) z -= 1
    if (actions.moveBackward()) z += 1
    if (actions.strafeLeft()) x += 1
    if (actions.strafeRight()) x -= 1
    if (actions.turnLeft()) y += 1
    if (actions.turnRight()) y -= 1

    return { x, z, y }
  }

  return {
    getActions,
    getAxis,
    actions,
    keyUpHandler,
    keyDownHandler,
    mouseHandler,
  }
}

export type KeyMapperType = ReturnType<typeof useKeyMapper>
