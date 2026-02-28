export const KeyBindings = {
  MOVE_FORWARD: "KeyW",
  MOVE_BACKWARD: "KeyS",
  MOVE_LEFT: "KeyA",
  MOVE_RIGHT: "KeyD",
  JUMP: "Space",
  MOUSEDOWNLEFT: "Mouse0", // Left mouse button
  MOUSEDOWNMIDDLE: "Mouse1", // Middle mouse button
  MOUSEDOWNRIGHT: "Mouse2", // Right mouse button
}

export type KeyBindingCode = (typeof KeyBindings)[keyof typeof KeyBindings]

export const ActiveKeys: Partial<Record<KeyBindingCode, boolean>> = {}

export function mouseHandler(event: MouseEvent, state: boolean) {
  if (event.button === 0) {
    ActiveKeys[KeyBindings.MOUSEDOWNLEFT] = state
  } else if (event.button === 1) {
    ActiveKeys[KeyBindings.MOUSEDOWNMIDDLE] = state
  } else if (event.button === 2) {
    ActiveKeys[KeyBindings.MOUSEDOWNRIGHT] = state
  }
  console.log(`Mouse button ${event.button} is now ${state ? "down" : "up"}.`)
}

export function keyHandler(event: KeyboardEvent, state: boolean) {
  const code = event.code as KeyBindingCode
  if (code in KeyBindings) {
    ActiveKeys[code] = state
    console.log(`Key ${code} is now ${state ? "down" : "up"}.`)
  }
}

export function keyUpHandler(event: KeyboardEvent) {
  keyHandler(event, false)
}

export function keyDownHandler(event: KeyboardEvent) {
  keyHandler(event, true)
}
