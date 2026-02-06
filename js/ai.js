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
     * Flee from a target. Moves directly away.
     */
    flee(fish, target, dt) {
        const dx = fish.x - target.x;
        const dy = fish.y - target.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            fish.vx = (dx / dist) * fish.speed * 1.2;
            fish.vy = (dy / dist) * fish.speed * 1.2;
        }
    },

    /**
     * Chase a target. Moves directly toward it.
     */
    chase(fish, target, dt) {
        const dx = target.x - fish.x;
        const dy = target.y - fish.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            fish.vx = (dx / dist) * fish.speed;
            fish.vy = (dy / dist) * fish.speed;
        }
    },
};
