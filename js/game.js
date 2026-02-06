const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const fpsDisplay = document.getElementById('fps-counter');

// --- Core objects ---
const player = new Player(canvas.width / 2, canvas.height / 2);
const state = new GameState();

// --- Fish arrays ---
let fishes = [];

// --- Per-species population config ---
const POPULATION = {
    plankton:       { min: 3, max: 5, create: createPlankton },
    shrimp:         { min: 2, max: 4, create: createShrimp,  yMin: 0.4, yMax: 0.9 },
    smallFish:      { min: 3, max: 5, create: createSmallFish },
    mediumPredator: { min: 2, max: 3, create: createMediumPredator },
    largePredator:  { min: 1, max: 1, create: createLargePredator },
    totalMax: 20,
};

const SPAWN_SAFE_DIST = 250;
const INVINCIBILITY_TIME = 1.5;
let invincibilityTimer = 0;
let gameTime = 0; // running time for animations

// --- Spawning ---
function randomSpawnPos(yMinPct, yMaxPct) {
    const yMin = yMinPct !== undefined ? canvas.height * yMinPct : 30;
    const yMax = yMaxPct !== undefined ? canvas.height * yMaxPct : canvas.height - 30;

    for (let i = 0; i < 20; i++) {
        const x = 30 + Math.random() * (canvas.width - 60);
        const y = yMin + Math.random() * (yMax - yMin);
        const dx = x - player.x;
        const dy = y - player.y;
        if (Math.sqrt(dx * dx + dy * dy) > SPAWN_SAFE_DIST) {
            return { x, y };
        }
    }
    return { x: 30, y: 30 };
}

function spawnInitialFish() {
    fishes = [];
    for (const [species, config] of Object.entries(POPULATION)) {
        if (species === 'totalMax') continue;
        for (let i = 0; i < config.min; i++) {
            const pos = randomSpawnPos(config.yMin, config.yMax);
            fishes.push(config.create(pos.x, pos.y));
        }
    }
}

function maintainPopulation() {
    if (fishes.length >= POPULATION.totalMax) return;

    for (const [species, config] of Object.entries(POPULATION)) {
        if (species === 'totalMax') continue;
        const count = fishes.filter(f => f.species === species).length;
        if (count < config.min) {
            const pos = randomSpawnPos(config.yMin, config.yMax);
            fishes.push(config.create(pos.x, pos.y));
            return; // spawn one per frame to stagger
        }
    }
}

// --- State callbacks ---
state.onStart = () => {
    player.reset(canvas.width / 2, canvas.height / 2);
    spawnInitialFish();
    Environment.generate(canvas.width, canvas.height);
    invincibilityTimer = INVINCIBILITY_TIME;
    eatEffects = [];
    gameTime = 0;
};

state.onRestart = () => {
    player.reset(canvas.width / 2, canvas.height / 2);
    spawnInitialFish();
    Environment.generate(canvas.width, canvas.height);
    invincibilityTimer = INVINCIBILITY_TIME;
    eatEffects = [];
    gameTime = 0;
};

// --- Timing ---
let lastTime = 0;
let frameCount = 0;
let fpsTimer = 0;
let currentFps = 0;

// --- Background ---
function drawBackground() {
    // Water gradient
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

    // Sandy bottom (extended for reef feel)
    const sandGrad = ctx.createLinearGradient(0, canvas.height - 60, 0, canvas.height);
    sandGrad.addColorStop(0, 'rgba(194, 168, 120, 0.0)');
    sandGrad.addColorStop(0.3, 'rgba(194, 168, 120, 0.25)');
    sandGrad.addColorStop(1, 'rgba(194, 168, 120, 0.65)');
    ctx.fillStyle = sandGrad;
    ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

    // Small rocks/pebbles on sandy bottom
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#8b7355';
    for (let i = 0; i < 12; i++) {
        const rx = 40 + (i * 67) % (canvas.width - 80);
        const ry = canvas.height - 10 - (i * 13 % 20);
        ctx.beginPath();
        ctx.ellipse(rx, ry, 3 + i % 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
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
        gameTime += dt;
        if (invincibilityTimer > 0) invincibilityTimer -= dt;

        // Check hiding BEFORE updating fish AI
        Environment.checkPlayerHiding(player);

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

        // Collision: player vs predator (skip during invincibility or when hidden)
        if (invincibilityTimer <= 0 && !player.isHidden) {
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
        Environment.drawBack(ctx, 0);
        player.draw(ctx);
        Environment.drawFront(ctx, 0);
        state.drawMenu(ctx, canvas.width, canvas.height);
    } else if (state.state === 'playing') {
        // Back environment layer (seaweed, coral back)
        Environment.drawBack(ctx, gameTime);

        // Fish
        for (const fish of fishes) {
            fish.draw(ctx);
        }

        // Player (flash during invincibility, translucent when hidden)
        if (invincibilityTimer > 0 && Math.floor(invincibilityTimer * 8) % 2 === 0) {
            ctx.globalAlpha = 0.4;
        } else if (player.isHidden) {
            ctx.globalAlpha = 0.55;
        }
        player.draw(ctx);
        ctx.globalAlpha = 1;

        // Front environment layer (coral tips, cave overhang)
        Environment.drawFront(ctx, gameTime);

        drawEatEffects();
        state.drawHUD(ctx, canvas.width, canvas.height, player.energy, player.maxEnergy, player.isHidden);
    } else if (state.state === 'gameOver') {
        Environment.drawBack(ctx, gameTime);
        for (const fish of fishes) {
            fish.draw(ctx);
        }
        player.draw(ctx);
        Environment.drawFront(ctx, gameTime);
        state.drawGameOver(ctx, canvas.width, canvas.height, player.energy);
    }

    requestAnimationFrame(gameLoop);
}

// Start
requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    gameLoop(timestamp);
});
