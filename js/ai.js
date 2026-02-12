/**
 * AI behavior functions for NPC fish.
 * Each fish using AI needs: x, y, vx, vy, speed, wanderTimer, wanderAngle
 */

const AI = {
    /**
     * Random wandering. Changes direction periodically.
     */
    wander(fish, dt) {
        fish.wanderTimer -= dt;
        if (fish.wanderTimer <= 0) {
            fish.wanderAngle = Math.random() * Math.PI * 2;
            fish.wanderTimer = 1.5 + Math.random() * 2; // 1.5–3.5 seconds
        }
        fish.vx = Math.cos(fish.wanderAngle) * fish.speed;
        fish.vy = Math.sin(fish.wanderAngle) * fish.speed;
    },

    /**
     * Slow drift for plankton. Very long direction-change intervals.
     */
    drift(fish, dt) {
        fish.wanderTimer -= dt;
        if (fish.wanderTimer <= 0) {
            fish.wanderAngle = Math.random() * Math.PI * 2;
            fish.wanderTimer = 4 + Math.random() * 6; // 4–10 seconds
        }
        fish.vx = Math.cos(fish.wanderAngle) * fish.speed * 0.5;
        fish.vy = Math.sin(fish.wanderAngle) * fish.speed * 0.5;
    },

    /**
     * Flee from a target. Moves directly away with gradual acceleration.
     */
    flee(fish, target, dt) {
        const dx = fish.x - target.x;
        const dy = fish.y - target.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            // Target velocity
            const targetVx = (dx / dist) * fish.speed * 1.2;
            const targetVy = (dy / dist) * fish.speed * 1.2;

            // Smoothly accelerate toward target velocity (lerp)
            const acceleration = 8; // How quickly fish reaches full speed
            fish.vx += (targetVx - fish.vx) * acceleration * dt;
            fish.vy += (targetVy - fish.vy) * acceleration * dt;
        }
    },

    /**
     * Chase a target. Wobble amount is configurable per fish. Gradual acceleration.
     */
    chase(fish, target, dt) {
        const dx = target.x - fish.x;
        const dy = target.y - fish.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            const wobbleAmount = fish.wobble !== undefined ? fish.wobble : 0.7;
            const wobble = (Math.random() - 0.5) * wobbleAmount;
            const angle = Math.atan2(dy, dx) + wobble;

            // Target velocity
            const targetVx = Math.cos(angle) * fish.speed;
            const targetVy = Math.sin(angle) * fish.speed;

            // Smoothly accelerate toward target velocity
            const acceleration = 6; // Slower than flee - predators are more deliberate
            fish.vx += (targetVx - fish.vx) * acceleration * dt;
            fish.vy += (targetVy - fish.vy) * acceleration * dt;
        }
    },
};
