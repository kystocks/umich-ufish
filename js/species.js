/**
 * Species factory functions — creates configured Fish instances.
 * Each species has distinct visuals, stats, and behaviors.
 */

// ============================================================
// PREY SPECIES
// ============================================================

/**
 * Plankton cluster — slow drifting, low energy, easy to catch.
 * Drawn as a cluster of small circles instead of a fish shape.
 */
function drawPlankton(ctx, fish) {
    ctx.save();
    ctx.translate(fish.x, fish.y);
    const positions = [
        { x: 0, y: 0 }, { x: 4, y: -3 }, { x: -3, y: -2 },
        { x: 3, y: 3 }, { x: -4, y: 2 },
    ];
    for (let i = 0; i < positions.length; i++) {
        const p = positions[i];
        const shade = i % 2 === 0 ? fish.color : fish.tailColor;
        ctx.fillStyle = shade;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2 + Math.random() * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function createPlankton(x, y) {
    return new Fish({
        x, y,
        speed: 20,  // Reduced from 30
        radius: 6,
        width: 12,
        height: 12,
        color: '#a8e6a3',
        tailColor: '#7bc47a',
        type: 'prey',
        species: 'plankton',
        detectRange: 0,      // never flees
        energyValue: 5,
        drawFn: drawPlankton,
    });
}

/**
 * Shrimp — moderate energy, fast flee, spawns near bottom.
 * Drawn with a curved body, antennae, and small legs.
 */
function drawShrimp(ctx, fish) {
    ctx.save();
    ctx.translate(fish.x, fish.y);

    // Flip to face movement direction
    if (fish.vx < -0.5) {
        ctx.scale(-1, 1);
    }

    // Curved body
    ctx.fillStyle = fish.color;
    ctx.beginPath();
    ctx.moveTo(-fish.width / 2, 0);
    ctx.quadraticCurveTo(0, -fish.height * 0.6, fish.width / 2, -2);
    ctx.quadraticCurveTo(0, fish.height * 0.4, -fish.width / 2, 0);
    ctx.fill();

    // Tail fan
    ctx.fillStyle = fish.tailColor;
    ctx.beginPath();
    ctx.moveTo(-fish.width / 2, 0);
    ctx.lineTo(-fish.width / 2 - 5, -3);
    ctx.lineTo(-fish.width / 2 - 6, 0);
    ctx.lineTo(-fish.width / 2 - 5, 3);
    ctx.closePath();
    ctx.fill();

    // Antennae
    ctx.strokeStyle = fish.tailColor;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(fish.width / 2, -2);
    ctx.lineTo(fish.width / 2 + 8, -6);
    ctx.moveTo(fish.width / 2, -1);
    ctx.lineTo(fish.width / 2 + 7, -8);
    ctx.stroke();

    // Small legs (3 pairs)
    ctx.strokeStyle = fish.tailColor;
    ctx.lineWidth = 0.6;
    for (let i = 0; i < 3; i++) {
        const lx = -fish.width * 0.15 + i * 5;
        ctx.beginPath();
        ctx.moveTo(lx, 2);
        ctx.lineTo(lx - 1, 5);
        ctx.stroke();
    }

    // Eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(fish.width / 3, -3, 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function createShrimp(x, y) {
    return new Fish({
        x, y,
        speed: 70,  // Reduced from 100
        radius: 8,
        width: 20,
        height: 10,
        color: '#f5a0a0',
        tailColor: '#e07070',
        type: 'prey',
        species: 'shrimp',
        detectRange: 120,
        energyValue: 10,
        drawFn: drawShrimp,
    });
}

/**
 * Small fish — standard prey (same as Phase 1 prey).
 * Uses the default Fish draw method.
 */
function createSmallFish(x, y) {
    return new Fish({
        x, y,
        speed: 60,  // Reduced from 80
        radius: 10,
        width: 24,
        height: 14,
        color: '#7ec8e3',
        tailColor: '#5ba3c4',
        type: 'prey',
        species: 'smallFish',
        detectRange: 150,
        energyValue: 15,
    });
}

// ============================================================
// PREDATOR SPECIES
// ============================================================

/**
 * Medium predator — same as Phase 1 predator.
 * Uses the default Fish draw method.
 */
function createMediumPredator(x, y) {
    return new Fish({
        x, y,
        speed: 100,  // Reduced from 140
        radius: 20,  // reduced from 30
        width: 60,
        height: 34,
        color: '#c0392b',
        tailColor: '#922b21',
        type: 'predator',
        species: 'mediumPredator',
        detectRange: 150,
        giveUpRange: 220,
        wobble: 0.7,
    });
}

/**
 * Large predator — tighter tracking, longer pursuit, harder to escape.
 * Drawn with jagged dorsal fin and teeth. Makes hiding essential.
 */
function drawLargePredator(ctx, fish) {
    ctx.save();
    ctx.translate(fish.x, fish.y);

    // Flip to face movement direction
    if (fish.vx < -0.5) {
        ctx.scale(-1, 1);
    }

    // Body
    ctx.fillStyle = fish.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, fish.width / 2, fish.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Jagged dorsal fin (3 spikes along top)
    ctx.fillStyle = '#6c2a8a';
    ctx.beginPath();
    ctx.moveTo(-fish.width * 0.25, -fish.height * 0.45);
    ctx.lineTo(-fish.width * 0.15, -fish.height * 0.85);
    ctx.lineTo(-fish.width * 0.05, -fish.height * 0.45);
    ctx.lineTo(fish.width * 0.05, -fish.height * 0.8);
    ctx.lineTo(fish.width * 0.15, -fish.height * 0.45);
    ctx.lineTo(fish.width * 0.22, -fish.height * 0.7);
    ctx.lineTo(fish.width * 0.3, -fish.height * 0.4);
    ctx.closePath();
    ctx.fill();

    // Tail
    ctx.fillStyle = fish.tailColor;
    ctx.beginPath();
    const tw = fish.width * 0.3;
    const th = fish.height * 0.4;
    ctx.moveTo(-fish.width / 2, 0);
    ctx.lineTo(-fish.width / 2 - tw, -th);
    ctx.lineTo(-fish.width / 2 - tw, th);
    ctx.closePath();
    ctx.fill();

    // Mouth with teeth
    ctx.fillStyle = '#2c0a3a';
    ctx.beginPath();
    ctx.moveTo(fish.width / 2 - 2, -3);
    ctx.lineTo(fish.width / 2 + 4, 0);
    ctx.lineTo(fish.width / 2 - 2, 3);
    ctx.closePath();
    ctx.fill();

    // Teeth
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 3; i++) {
        const tx = fish.width / 2 - 2 + i * 1.5;
        ctx.beginPath();
        ctx.moveTo(tx, -2);
        ctx.lineTo(tx + 1, 0);
        ctx.lineTo(tx, 2);
        ctx.closePath();
        ctx.fill();
    }

    // Eye — larger and more menacing
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.arc(fish.width / 4, -fish.height * 0.15, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(fish.width / 4 + 1, -fish.height * 0.15, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function createLargePredator(x, y) {
    return new Fish({
        x, y,
        speed: 120,  // Reduced from 170
        radius: 30,  // reduced from 45
        width: 90,
        height: 50,
        color: '#7d3c98',
        tailColor: '#5b2c6f',
        type: 'predator',
        species: 'largePredator',
        detectRange: 250,
        giveUpRange: 400,
        wobble: 0.35,
        drawFn: drawLargePredator,
    });
}
