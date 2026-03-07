export const useKeyMapper = () => {
  const KeyBindings = {
    MOVE_FORWARD: "KeyW",
    MOVE_BACKWARD: "KeyS",
    MOVE_LEFT: "KeyA",
    MOVE_RIGHT: "KeyD",
    JUMP: "Space",
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
    console.log(`Mouse button ${event.button} is now ${state ? "down" : "up"}.`)
  }

  function keyHandler(event: KeyboardEvent, state: boolean) {
    const code = event.code as KeyBindingCode
    console.log(`Key ${code} is now ${state ? "down" : "up"}.`)
    switch (code) {
      case KeyBindings.MOVE_FORWARD:
        ActiveKeys.set(KeyBindings.MOVE_FORWARD, state)
        break
      case KeyBindings.MOVE_BACKWARD:
        ActiveKeys.set(KeyBindings.MOVE_BACKWARD, state)
        break
      case KeyBindings.MOVE_LEFT:
        ActiveKeys.set(KeyBindings.MOVE_LEFT, state)
        break
      case KeyBindings.MOVE_RIGHT:
        ActiveKeys.set(KeyBindings.MOVE_RIGHT, state)
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

  /**
   * Action Map for Device -> Game Meaning
   * @param input
   * @returns
   */
  function getActions() {
    return {
      moveForward: isKeyActive(KeyBindings.MOVE_FORWARD),
      moveBackward: isKeyActive(KeyBindings.MOVE_BACKWARD),
      moveLeft: isKeyActive(KeyBindings.MOVE_LEFT),
      moveRight: isKeyActive(KeyBindings.MOVE_RIGHT),
      jump: isKeyActive(KeyBindings.JUMP),

      mouseLeft: isKeyActive(KeyBindings.MOUSEDOWNLEFT),
      mouseRight: isKeyActive(KeyBindings.MOUSEDOWNRIGHT),
    }
  }

  return {
    getActions,
    keyUpHandler,
    keyDownHandler,
    mouseHandler,
  }
}
