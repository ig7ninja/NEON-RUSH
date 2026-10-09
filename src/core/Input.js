const MOVE_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight',
]);

export class Input {
  constructor() {
    this.down = new Set();
    this.pressed = new Set();

    window.addEventListener('keydown', (e) => this.handleKey(e, true));
    window.addEventListener('keyup', (e) => this.handleKey(e, false));
    window.addEventListener('blur', () => this.down.clear());
  }

  handleKey(e, isDown) {
    if (e.code === 'F11') return;
    if (MOVE_KEYS.has(e.code) || e.code === 'Space') e.preventDefault();
    if (isDown) {
      if (!this.down.has(e.code)) this.pressed.add(e.code);
      this.down.add(e.code);
    } else {
      this.down.delete(e.code);
    }
  }

  isDown(code) {
    return this.down.has(code);
  }

  wasPressed(code) {
    return this.pressed.has(code);
  }

  getAxis() {
    let x = 0;
    let y = 0;
    if (this.isDown('KeyA') || this.isDown('ArrowLeft')) x -= 1;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) x += 1;
    if (this.isDown('KeyW') || this.isDown('ArrowUp')) y -= 1;
    if (this.isDown('KeyS') || this.isDown('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.SQRT2;
      return { x: x * inv, y: y * inv };
    }
    return { x, y };
  }

  endFrame() {
    this.pressed.clear();
  }
}
