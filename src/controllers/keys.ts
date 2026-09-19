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
  let autoRun = false

  function isKeyActive(key: KeyBindingCode): boolean {
    return ActiveKeys.get(key) || false
  }

  function mouseHandler(event: MouseEvent, state: boolean) {
    if (event.button === 0) {
      ActiveKeys.set(KeyBindings.MOUSEDOWNLEFT, state)
    } else if (event.button === 1) {
      if (state && !isKeyActive(KeyBindings.MOUSEDOWNMIDDLE)) {
        autoRun = !autoRun
      }
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
    keyHandler(event, false)
  }

  function keyDownHandler(event: KeyboardEvent) {
    keyHandler(event, true)
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
    autoRun: () => autoRun,

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
      autoRun: actions.autoRun(),

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

    const forwardPressed = actions.moveForward()
    const backwardPressed = actions.moveBackward()

    if (autoRun && (forwardPressed || backwardPressed)) {
      autoRun = false
    }

    // If both mouse buttons are down, move in camera direction
    if (
      actions.mouseLeft() &&
      actions.mouseRight() &&
      cameraAzimuth !== undefined
    ) {
      autoRun = false

      // Player rotation is aligned to the camera by the movement handler.
      // Keep moving forward while allowing strafe and left/right keys to combine with it.
      x = actions.strafeLeft() ? 1 : 0
      x += actions.strafeRight() ? -1 : 0
      x += actions.turnLeft() ? -1 : 0
      x += actions.turnRight() ? 1 : 0
      z = 1
      if (forwardPressed) z -= 1
      if (backwardPressed) z += 1

      return { x, z, y: cameraAzimuth }
    }

    if (autoRun) z += 1

    if (forwardPressed) z -= 1
    if (backwardPressed) z += 1
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
