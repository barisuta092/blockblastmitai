import { Game } from './Game.js'

document.addEventListener('DOMContentLoaded', () => {
  try {
    const game = new Game('gameCanvas');
    window.game = game; // Debug用
  } catch (err) {
    console.error("Game Initialize Failed:", err);
    document.body.innerHTML += `<div style="color:red; padding:20px;">Error: ${err.message}</div>`;
  }
});
