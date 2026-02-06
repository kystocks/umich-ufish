const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const fpsDisplay = document.getElementById('fps-counter');

// --- Core objects ---
const player = new Player(canvas.width / 2, canvas.height / 2);
const state = new GameState();

// --- Fish arrays ---
let fishes = [];

const PREY_MIN = 5;
const PREDATOR_MIN = 2;
const MAX_FISH = 15;
const SPAWN_SAFE_DIST = 250; // min distance from player when spawning
const INVINCIBILITY_TIME = 1.5; // seconds of safety after starting/restarting
let invincibilityTimer = 0;

// --- Spawning ---
function randomSpawnPos() {
    // Try up to 20 times to find a spot away from the player
    for (let i = 0; i < 20; i++) {
        const x = 30 + Math.random() * (canvas.width - 60);
        const y = 30 + Math.random() * (canvas.height - 60);
        const dx = x - player.x;
        const dy = y - player.y;
        if (Math.sqrt(dx * dx + dy * dy) > SPAWN_SAFE_DIST) {
            return { x, y };
        }
    }
    // Fallback: spawn at edge
    return { x: 30, y: 30 };
}

function spawnInitialFish() {
    fishes = [];
    for (let i = 0; i < PREY_MIN; i++) {
        const pos = randomSpawnPos();
        fishes.push(createPrey(pos.x, pos.y));
    }
    for (let i = 0; i < PREDATOR_MIN; i++) {
        const pos = randomSpawnPos();
        fishes.push(createPredator(pos.x, pos.y));
    }
}

function maintainPopulation() {
    if (fishes.length >= MAX_FISH) return;

    const preyCount = fishes.filter(f => f.type === 'prey').length;
    const predCount = fishes.filter(f => f.type === 'predator').length;

    if (preyCount < PREY_MIN) {
        const pos = randomSpawnPos();
        fishes.push(createPrey(pos.x, pos.y));
    }
    if (predCount < PREDATOR_MIN) {
        const pos = randomSpawnPos();
        fishes.push(createPredator(pos.x, pos.y));
    }
}

// --- State callbacks ---
state.onStart = () => {
    player.reset(canvas.width / 2, canvas.height / 2);
    spawnInitialFish();
    invincibilityTimer = INVINCIBILITY_TIME;
    eatEffects = [];
};

state.onRestart = () => {
    player.reset(canvas.width / 2, canvas.height / 2);
    spawnInitialFish();
    invincibilityTimer = INVINCIBILITY_TIME;
    eatEffects = [];
};

// --- Timing ---
let lastTime = 0;
let frameCount = 0;
let fpsTimer = 0;
let currentFps = 0;

// --- Background ---
function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#0e7abf');
    grad.addColorStop(0.5, '#0b5e8e');
    grad.addColorStop(1, '#073b5c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Light rays
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

// --- Eat effect ---
let eatEffects = [];

function spawnEatEffect(x, y) {
    for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 30 + Math.random() * 50;
        eatEffects.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.4,
            maxLife: 0.4,
        });
    }
}

function updateEatEffects(dt) {
    for (let i = eatEffects.length - 1; i >= 0; i--) {
        const p = eatEffects[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) eatEffects.splice(i, 1);
    }
}

function drawEatEffects() {
    for (const p of eatEffects) {
        const alpha = p.life / p.maxLife;
        ctx.fillStyle = `rgba(255, 255, 100, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// --- Main loop ---
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    // FPS
    frameCount++;
    fpsTimer += dt;
    if (fpsTimer >= 1) {
        currentFps = frameCount;
        frameCount = 0;
        fpsTimer -= 1;
        fpsDisplay.textContent = `FPS: ${currentFps}`;
    }

    // --- Update ---
    state.update(dt);

    if (state.state === 'playing') {
        if (invincibilityTimer > 0) invincibilityTimer -= dt;

        player.update(dt, canvas.width, canvas.height);

        // Update fish
        for (const fish of fishes) {
            fish.update(dt, canvas.width, canvas.height, player);
        }

        // Collision: player vs prey
        for (let i = fishes.length - 1; i >= 0; i--) {
            const fish = fishes[i];
            if (fish.type === 'prey' && checkCollision(player, fish)) {
                player.eat(fish.energyValue);
                state.score++;
                spawnEatEffect(fish.x, fish.y);
                fishes.splice(i, 1);
            }
        }

        // Collision: player vs predator (skip during invincibility)
        if (invincibilityTimer <= 0) {
            for (const fish of fishes) {
                if (fish.type === 'predator' && checkCollision(player, fish)) {
                    state.gameOver();
                    break;
                }
            }
        }

        // Starvation check
        if (player.energy <= 0) {
            state.gameOver();
        }

        // Maintain population
        maintainPopulation();

        // Eat effects
        updateEatEffects(dt);
    }

    // --- Render ---
    drawBackground();

    if (state.state === 'menu') {
        // Draw fish swimming in background for ambiance
        player.draw(ctx);
        state.drawMenu(ctx, canvas.width, canvas.height);
    } else if (state.state === 'playing') {
        for (const fish of fishes) {
            fish.draw(ctx);
        }
        // Flash player during invincibility
        if (invincibilityTimer > 0 && Math.floor(invincibilityTimer * 8) % 2 === 0) {
            ctx.globalAlpha = 0.4;
        }
        player.draw(ctx);
        ctx.globalAlpha = 1;
        drawEatEffects();
        state.drawHUD(ctx, canvas.width, canvas.height, player.energy, player.maxEnergy);
    } else if (state.state === 'gameOver') {
        for (const fish of fishes) {
            fish.draw(ctx);
        }
        player.draw(ctx);
        state.drawGameOver(ctx, canvas.width, canvas.height, player.energy);
    }

    requestAnimationFrame(gameLoop);
}

// Start
requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    gameLoop(timestamp);
});
