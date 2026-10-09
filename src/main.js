import { Game } from './core/Game.js';

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);

function unlockAudio() {
  game.audio.unlock();
  window.removeEventListener('keydown', unlockAudio);
  window.removeEventListener('pointerdown', unlockAudio);
}
window.addEventListener('keydown', unlockAudio);
window.addEventListener('pointerdown', unlockAudio);

window.addEventListener('contextmenu', (e) => {
  if (e.target === canvas) e.preventDefault();
});

window.__game = game;
