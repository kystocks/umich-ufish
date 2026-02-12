const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const fpsDisplay = document.getElementById('fps-counter');

// --- Core objects ---
const player = new Player(canvas.width / 2, canvas.height / 2);
const state = new GameState();
const worldGrid = new WorldGrid(canvas.width, canvas.height);

// --- Click handler for freezing prey ---
canvas.addEventListener('gameclick', (e) => {
    const clickX = e.detail.x;
    const clickY = e.detail.y;

    // Find any prey fish near the click
    for (const fish of fishes) {
        if (fish.type === 'prey') {
            const dx = fish.x - clickX;
            const dy = fish.y - clickY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // If clicked within fish radius, freeze it
            if (dist < fish.radius + 20) {
                fish.freeze(2.0);  // Freeze for 2 seconds
            }
        }
    }
});

// --- Fish arrays ---
let fishes = [];

// --- Per-species population config ---
const POPULATION = {
    plankton:       { min: 3, max: 5, create: createPlankton },
    shrimp:         { min: 2, max: 4, create: createShrimp,  yMin: 0.4, yMax: 0.9 },
    smallFish:      { min: 3, max: 5, create: createSmallFish },
    mediumPredator: { min: 2, max: 3, create: createMediumPredator },
    largePredator:  { min: 1, max: 1, create: createLargePredator },
    cleanerWrasse:  { min: 1, max: 2, create: createCleanerWrasse },
    cleanerShrimp:  { min: 1, max: 1, create: createCleanerShrimp, yMin: 0.6, yMax: 0.95 },
    totalMax: 25,
};

const SPAWN_SAFE_DIST = 250;
const INVINCIBILITY_TIME = 1.5;
let invincibilityTimer = 0;
let gameTime = 0; // running time for animations

// Debug info (disabled)
let debugLog = [];
function addDebugLog(msg) {
    // Disabled for now
}

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
    const zone = worldGrid.getCurrentZone();

    // Spawn based on zone-specific populations
    for (const [species, counts] of Object.entries(zone.species)) {
        const config = POPULATION[species];
        if (!config) continue;

        const amount = counts.min + Math.floor(Math.random() * (counts.max - counts.min + 1));
        for (let i = 0; i < amount; i++) {
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
    const zoneSeed = worldGrid.currentZone.x * 1000 + worldGrid.currentZone.y * 100;
    Environment.generate(canvas.width, canvas.height, zoneSeed);
    FoodManager.generate(canvas.width, canvas.height);
    invincibilityTimer = INVINCIBILITY_TIME;
    eatEffects = [];
    gameTime = 0;
};

state.onRestart = () => {
    player.reset(canvas.width / 2, canvas.height / 2);
    spawnInitialFish();
    const zoneSeed = worldGrid.currentZone.x * 1000 + worldGrid.currentZone.y * 100;
    Environment.generate(canvas.width, canvas.height, zoneSeed);
    FoodManager.generate(canvas.width, canvas.height);
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
    const zone = worldGrid.getCurrentZone();
    const zoneSeed = worldGrid.currentZone.x * 100 + worldGrid.currentZone.y * 10;

    // Water gradient based on zone depth
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    const colors = zone.waterColor;
    grad.addColorStop(0, colors.start);
    grad.addColorStop(0.5, colors.mid);
    grad.addColorStop(1, colors.end);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Light rays (more in shallow zones, fewer in deep)
    const rayCount = zone.depth === 'shallow' ? 6 : zone.depth === 'mid' ? 4 : 2;
    const rayAlpha = zone.lightLevel * 0.06;
    ctx.save();
    ctx.globalAlpha = rayAlpha;
    ctx.fillStyle = '#fff';
    for (let i = 0; i < rayCount; i++) {
        // Deterministic positions based on zone seed
        const x = 80 + ((zoneSeed + i * 97) % (canvas.width - 160));
        ctx.beginPath();
        ctx.moveTo(x - 15, 0);
        ctx.lineTo(x + 15, 0);
        ctx.lineTo(x + 40 + i * 10, canvas.height);
        ctx.lineTo(x - 40 - i * 10, canvas.height);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();

    // Sandy/rocky bottom (depth varies by zone)
    if (zone.biome === 'sandy' || zone.biome === 'rocky' || zone.depth === 'deep') {
        const bottomHeight = zone.depth === 'deep' ? 80 : 60;
        const sandGrad = ctx.createLinearGradient(0, canvas.height - bottomHeight, 0, canvas.height);

        if (zone.biome === 'rocky') {
            sandGrad.addColorStop(0, 'rgba(120, 100, 80, 0.0)');
            sandGrad.addColorStop(0.3, 'rgba(120, 100, 80, 0.3)');
            sandGrad.addColorStop(1, 'rgba(120, 100, 80, 0.7)');
        } else {
            sandGrad.addColorStop(0, 'rgba(194, 168, 120, 0.0)');
            sandGrad.addColorStop(0.3, 'rgba(194, 168, 120, 0.25)');
            sandGrad.addColorStop(1, 'rgba(194, 168, 120, 0.65)');
        }
        ctx.fillStyle = sandGrad;
        ctx.fillRect(0, canvas.height - bottomHeight, canvas.width, bottomHeight);

        // Deterministic rocks/pebbles
        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = zone.biome === 'rocky' ? '#6b5d4f' : '#8b7355';
        const pebbleCount = zone.biome === 'rocky' ? 15 : 12;
        for (let i = 0; i < pebbleCount; i++) {
            const rx = 40 + ((zoneSeed + i * 67) % (canvas.width - 80));
            const ry = canvas.height - 10 - ((zoneSeed + i * 13) % 20);
            const size = 3 + ((zoneSeed + i) % 3);
            ctx.beginPath();
            ctx.ellipse(rx, ry, size, 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
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

        player.update(dt, canvas.width, canvas.height, worldGrid);

        // Check for zone transitions
        const newZone = worldGrid.checkZoneTransition(player);
        if (newZone) {
            worldGrid.startTransition(newZone, player);
            // Respawn fish and environment for new zone
            spawnInitialFish();
            const zoneSeed = worldGrid.currentZone.x * 1000 + worldGrid.currentZone.y * 100;
            Environment.generate(canvas.width, canvas.height, zoneSeed);
            FoodManager.generate(canvas.width, canvas.height);
        }

        // Update transition animation
        worldGrid.updateTransition(dt);

        // Update food sources
        FoodManager.update(dt, canvas.width, canvas.height, gameTime);

        // Update fish (pass all fish so they can interact with each other)
        for (const fish of fishes) {
            fish.update(dt, canvas.width, canvas.height, player, fishes);
        }

        // Check if player has reached click target and should eat
        if (player.hasTarget && player.targetX !== null && player.targetY !== null) {
            const targetDist = Math.sqrt(
                (player.x - player.targetX) ** 2 +
                (player.y - player.targetY) ** 2
            );

            // Player reached target location
            if (targetDist < 30) {
                // Check base food (plankton, algae, detritus)
                const foodEaten = FoodManager.checkPlayerCollision(player);
                for (const food of foodEaten) {
                    if (player.canEatFood(food.type)) {
                        player.eat(food.type, food.value);
                        spawnEatEffect(food.x, food.y);
                        player.hasTarget = false;  // Clear target after eating
                    }
                }

                // Check prey fish
                for (let i = fishes.length - 1; i >= 0; i--) {
                    const fish = fishes[i];
                    if (fish.type === 'prey' && checkCollision(player, fish)) {
                        const inDiet = player.canEatFood(fish.species);

                        if (inDiet) {
                            player.eat(fish.species, fish.energyValue);
                            state.score++;
                            addDebugLog(`${fish.species}: OK (+${fish.energyValue}E)`);
                        } else {
                            player.takeDamage(20);
                            player.energy = Math.min(player.maxEnergy, player.energy + fish.energyValue * 0.5);
                            addDebugLog(`${fish.species}: BAD (-20H)`);
                        }

                        spawnEatEffect(fish.x, fish.y);
                        fishes.splice(i, 1);
                        player.hasTarget = false;  // Clear target after eating
                        break;
                    }
                }

                // If nothing was eaten at target, clear target anyway
                if (player.hasTarget) {
                    player.hasTarget = false;
                }
            }
        }

        // Collision: player vs cleaners (gradual health restoration)
        for (const fish of fishes) {
            if (fish.type === 'cleaner' && checkCollision(player, fish)) {
                // Restore health gradually over time while in contact
                const healthBefore = player.health;
                const restoreAmount = (fish.healthRestoreRate || 5) * dt;
                player.restoreHealth(restoreAmount);

                // Show occasional sparkle effect while being cleaned
                if (Math.random() < 0.1) {  // 10% chance per frame
                    spawnEatEffect(fish.x, fish.y);
                }
            }
        }

        // Check for species advancement
        if (player.canAdvance()) {
            const advanced = player.advanceSpecies();
            if (advanced) {
                state.triggerAdvancement(player.currentSpecies.name);
                // Grant bonus points
                player.points += 50;
            }
        }

        // Fish eat each other! (ecosystem simulation)
        for (let i = fishes.length - 1; i >= 0; i--) {
            const predator = fishes[i];
            if (predator.type !== 'predator') continue;

            for (let j = fishes.length - 1; j >= 0; j--) {
                if (i === j) continue;
                const prey = fishes[j];
                if (prey.type !== 'prey') continue;

                // Predators eat prey fish
                if (checkCollision(predator, prey)) {
                    // Prey eaten!
                    spawnEatEffect(prey.x, prey.y);
                    fishes.splice(j, 1);
                    if (j < i) i--; // adjust index
                    break;
                }
            }
        }

        // Collision: player vs predator (skip during invincibility or when hidden)
        if (invincibilityTimer <= 0 && !player.isHidden) {
            for (const fish of fishes) {
                if (fish.type === 'predator' && checkCollision(player, fish)) {
                    state.gameOver('predator');
                    break;
                }
            }
        }

        // Death checks
        if (player.energy <= 0) {
            state.gameOver('starvation');
        }
        if (player.health <= 0) {
            state.gameOver('damage');
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
    } else if (state.state === 'playing' || state.state === 'advancing') {
        // Back environment layer (seaweed, coral back)
        Environment.drawBack(ctx, gameTime);

        // Food sources (plankton, algae, detritus)
        FoodManager.draw(ctx, gameTime);

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

        // Show HUD or advancement screen
        if (state.state === 'playing') {
            state.drawHUD(ctx, canvas.width, canvas.height, player);

            // Zone indicator and mini-map
            worldGrid.drawZoneIndicator(ctx);
            worldGrid.drawMiniMap(ctx);
        } else if (state.state === 'advancing') {
            state.drawAdvancement(ctx, canvas.width, canvas.height);
        }
    } else if (state.state === 'gameOver') {
        Environment.drawBack(ctx, gameTime);
        for (const fish of fishes) {
            fish.draw(ctx);
        }
        player.draw(ctx);
        Environment.drawFront(ctx, gameTime);
        state.drawGameOver(ctx, canvas.width, canvas.height, player);
    }

    requestAnimationFrame(gameLoop);
}

// Start
requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    gameLoop(timestamp);
});
