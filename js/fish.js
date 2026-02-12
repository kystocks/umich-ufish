/**
 * NPC Fish — used for both prey and predators.
 *
 * Config object:
 *   x, y          — spawn position
 *   speed         — movement speed (px/s)
 *   radius        — collision radius
 *   width, height — visual size
 *   color         — body fill color
 *   tailColor     — tail fill color
 *   type          — 'prey' | 'predator'
 *   species       — species identifier string
 *   detectRange   — range at which AI reacts to player
 *   giveUpRange   — (predator only) stop chasing beyond this
 *   energyValue   — (prey only) energy gained when eaten
 *   wobble        — (predator only) chase inaccuracy, default 0.7
 *   drawFn        — (optional) custom draw function(ctx, fish)
 */
class Fish {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.vx = 0;
        this.vy = 0;
        this.speed = config.speed;
        this.radius = config.radius;
        this.width = config.width;
        this.height = config.height;
        this.color = config.color;
        this.tailColor = config.tailColor;
        this.type = config.type;               // 'prey' or 'predator'
        this.species = config.species || '';
        this.detectRange = config.detectRange;
        this.giveUpRange = config.giveUpRange || 0;
        this.energyValue = config.energyValue || 0;
        this.wobble = config.wobble !== undefined ? config.wobble : 0.7;
        this.drawFn = config.drawFn || null;
        this.alive = true;

        // AI state
        this.wanderTimer = 0;
        this.wanderAngle = Math.random() * Math.PI * 2;

        // Awareness system - fish need time to "notice" threats
        this.currentThreat = null;
        this.threatAwarenessTime = 0;
        this.awarenessThreshold = 0.3 + Math.random() * 0.2; // 0.3-0.5 seconds to react
        this.isAwareOfThreat = false;

        // Hunting state for predators
        this.currentPrey = null;
        this.preyAwarenessTime = 0;
        this.isAwareOfPrey = false;

        // Frozen state (when clicked by player)
        this.isFrozen = false;
        this.frozenTimer = 0;
    }

    update(dt, canvasWidth, canvasHeight, player, allFish = []) {
        if (!this.alive) return;

        // Handle frozen state (when clicked)
        if (this.isFrozen) {
            this.frozenTimer -= dt;
            if (this.frozenTimer <= 0) {
                this.isFrozen = false;
            }
            // Stop all movement while frozen
            this.vx *= 0.85;
            this.vy *= 0.85;

            // Update position with slowing velocity
            this.x += this.vx * dt;
            this.y += this.vy * dt;

            // Still apply boundaries
            const halfW = this.width / 2;
            const halfH = this.height / 2;
            if (this.x < halfW) { this.x = halfW; this.vx = 0; }
            if (this.x > canvasWidth - halfW) { this.x = canvasWidth - halfW; this.vx = 0; }
            if (this.y < halfH) { this.y = halfH; this.vy = 0; }
            if (this.y > canvasHeight - halfH) { this.y = canvasHeight - halfH; this.vy = 0; }
            return;
        }

        const distToPlayer = distanceBetween(this, player);

        if (this.type === 'prey') {
            if (this.species === 'plankton') {
                // Plankton drifts — never flees
                AI.drift(this, dt);
            } else {
                // Check for nearby threats (player OR other predators)
                // Reduced detection range: was detectRange, now 0.7x
                let nearestThreat = null;
                let nearestDist = this.detectRange * 0.7;

                // Check player
                if (distToPlayer < nearestDist) {
                    nearestThreat = player;
                    nearestDist = distToPlayer;
                }

                // Check other predator fish
                for (const other of allFish) {
                    if (other === this || other.type !== 'predator') continue;
                    const dist = distanceBetween(this, other);
                    if (dist < nearestDist) {
                        nearestThreat = other;
                        nearestDist = dist;
                    }
                }

                // Awareness system - need to see threat for a bit before reacting
                if (nearestThreat) {
                    if (this.currentThreat === nearestThreat) {
                        // Same threat, build awareness
                        this.threatAwarenessTime += dt;
                        if (this.threatAwarenessTime >= this.awarenessThreshold) {
                            this.isAwareOfThreat = true;
                        }
                    } else {
                        // New threat detected, reset awareness
                        this.currentThreat = nearestThreat;
                        this.threatAwarenessTime = 0;
                        this.isAwareOfThreat = false;
                    }
                } else {
                    // No threat nearby, reset
                    this.currentThreat = null;
                    this.threatAwarenessTime = 0;
                    this.isAwareOfThreat = false;
                }

                // Only flee if aware of threat
                if (this.isAwareOfThreat && nearestThreat) {
                    AI.flee(this, nearestThreat, dt);
                } else {
                    AI.wander(this, dt);
                }
            }
        } else if (this.type === 'predator') {
            // Reduced detection range for predators too
            const detectionRange = this.detectRange * 0.6;

            // Predators chase player if close (and not hidden)
            if (distToPlayer < detectionRange && !player.isHidden) {
                // Check awareness of player as threat/prey
                if (this.currentPrey === player) {
                    this.preyAwarenessTime += dt;
                    if (this.preyAwarenessTime >= this.awarenessThreshold) {
                        this.isAwareOfPrey = true;
                    }
                } else {
                    this.currentPrey = player;
                    this.preyAwarenessTime = 0;
                    this.isAwareOfPrey = false;
                }

                if (this.isAwareOfPrey) {
                    AI.chase(this, player, dt);
                } else {
                    AI.wander(this, dt);
                }
            } else {
                // Or hunt nearby prey fish!
                let nearestPrey = null;
                let nearestDist = detectionRange * 0.8;

                for (const other of allFish) {
                    if (other === this || other.type !== 'prey') continue;
                    const dist = distanceBetween(this, other);
                    if (dist < nearestDist) {
                        nearestPrey = other;
                        nearestDist = dist;
                    }
                }

                if (nearestPrey) {
                    // Check awareness
                    if (this.currentPrey === nearestPrey) {
                        this.preyAwarenessTime += dt;
                        if (this.preyAwarenessTime >= this.awarenessThreshold) {
                            this.isAwareOfPrey = true;
                        }
                    } else {
                        this.currentPrey = nearestPrey;
                        this.preyAwarenessTime = 0;
                        this.isAwareOfPrey = false;
                    }

                    if (this.isAwareOfPrey) {
                        AI.chase(this, nearestPrey, dt);
                    } else {
                        AI.wander(this, dt);
                    }
                } else {
                    // No prey found
                    this.currentPrey = null;
                    this.preyAwarenessTime = 0;
                    this.isAwareOfPrey = false;
                    AI.wander(this, dt);
                }
            }
        }

        // Move
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Bounce off canvas edges
        const halfW = this.width / 2;
        const halfH = this.height / 2;
        if (this.x < halfW) { this.x = halfW; this.vx = Math.abs(this.vx); }
        if (this.x > canvasWidth - halfW) { this.x = canvasWidth - halfW; this.vx = -Math.abs(this.vx); }
        if (this.y < halfH) { this.y = halfH; this.vy = Math.abs(this.vy); }
        if (this.y > canvasHeight - halfH) { this.y = canvasHeight - halfH; this.vy = -Math.abs(this.vy); }
    }

    draw(ctx) {
        if (!this.alive) return;

        // Use custom draw function if provided
        if (this.drawFn) {
            this.drawFn(ctx, this);
            return;
        }

        // Default fish drawing
        ctx.save();
        ctx.translate(this.x, this.y);

        // Flip to face movement direction
        if (this.vx < -0.5) {
            ctx.scale(-1, 1);
        }

        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tail
        ctx.fillStyle = this.tailColor;
        ctx.beginPath();
        const tw = this.width * 0.25;
        const th = this.height * 0.35;
        ctx.moveTo(-this.width / 2, 0);
        ctx.lineTo(-this.width / 2 - tw, -th);
        ctx.lineTo(-this.width / 2 - tw, th);
        ctx.closePath();
        ctx.fill();

        // Eye
        const eyeR = Math.max(2, this.width * 0.08);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.width / 4, -this.height * 0.15, eyeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.width / 4 + 1, -this.height * 0.15, eyeR * 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /**
     * Freeze this fish temporarily (when clicked)
     */
    freeze(duration = 2.0) {
        this.isFrozen = true;
        this.frozenTimer = duration;
    }
}
