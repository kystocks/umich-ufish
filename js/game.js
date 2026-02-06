const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const fpsDisplay = document.getElementById('fps-counter');

// --- Game state ---
const player = new Player(canvas.width / 2, canvas.height / 2);

let lastTime = 0;
let frameCount = 0;
let fpsTimer = 0;
let currentFps = 0;

// --- Water background ---
function drawBackground() {
    // Gradient ocean
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#0e7abf');
    grad.addColorStop(0.5, '#0b5e8e');
    grad.addColorStop(1, '#073b5c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Simple light rays from the top
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 5; i++) {
        const x = 100 + i * 160;
        ctx.beginPath();
        ctx.moveTo(x - 15, 0);
        ctx.lineTo(x + 15, 0);
        ctx.lineTo(x + 40 + i * 10, canvas.height);
        ctx.lineTo(x - 40 - i * 10, canvas.height);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();

    // Sandy bottom
    const sandGrad = ctx.createLinearGradient(0, canvas.height - 40, 0, canvas.height);
    sandGrad.addColorStop(0, 'rgba(194, 168, 120, 0.0)');
    sandGrad.addColorStop(0.4, 'rgba(194, 168, 120, 0.3)');
    sandGrad.addColorStop(1, 'rgba(194, 168, 120, 0.6)');
    ctx.fillStyle = sandGrad;
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
}

// --- HUD ---
function drawHUD() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '14px monospace';
    ctx.fillText('WASD / Arrow Keys to move', 10, canvas.height - 14);
}

// --- Main loop ---
function gameLoop(timestamp) {
    // Compute delta time in seconds, cap at 50ms to avoid spiral of death
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    // FPS tracking
    frameCount++;
    fpsTimer += dt;
    if (fpsTimer >= 1) {
        currentFps = frameCount;
        frameCount = 0;
        fpsTimer -= 1;
        fpsDisplay.textContent = `FPS: ${currentFps}`;
    }

    // Update
    player.update(dt, canvas.width, canvas.height);

    // Render
    drawBackground();
    player.draw(ctx);
    drawHUD();

    requestAnimationFrame(gameLoop);
}

// Start the loop
requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    gameLoop(timestamp);
});
