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
    }

    update(dt, canvasWidth, canvasHeight, player) {
        if (!this.alive) return;

        const dist = distanceBetween(this, player);

        if (this.type === 'prey') {
            if (this.species === 'plankton') {
                // Plankton drifts — never flees
                AI.drift(this, dt);
            } else if (dist < this.detectRange) {
                AI.flee(this, player, dt);
            } else {
                AI.wander(this, dt);
            }
        } else if (this.type === 'predator') {
            // Cannot detect hidden player
            if (dist < this.detectRange && !player.isHidden) {
                AI.chase(this, player, dt);
            } else {
                AI.wander(this, dt);
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
}
