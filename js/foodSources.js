/**
 * Base food sources: plankton, algae, detritus
 * These are the foundation of the food chain.
 */

// ============================================================
// PLANKTON - Drifting microorganisms
// ============================================================

class Plankton {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 20;  // slow drift
        this.vy = (Math.random() - 0.5) * 20;
        this.radius = 3;
        this.type = 'plankton';
        this.energyValue = 5;
        this.opacity = 0.6 + Math.random() * 0.4;
        this.pulsePhase = Math.random() * Math.PI * 2;
    }

    update(dt, canvasWidth, canvasHeight) {
        // Gentle drifting
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Wrap around edges
        if (this.x < -10) this.x = canvasWidth + 10;
        if (this.x > canvasWidth + 10) this.x = -10;
        if (this.y < -10) this.y = canvasHeight + 10;
        if (this.y > canvasHeight + 10) this.y = -10;
    }

    draw(ctx, time) {
        ctx.save();
        const pulse = Math.sin(time * 2 + this.pulsePhase) * 0.2 + 0.8;
        ctx.globalAlpha = this.opacity * pulse;

        // Draw as small glowing particles
        ctx.fillStyle = '#a8e6a3';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        ctx.fillStyle = '#7bc47a';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// ============================================================
// ALGAE - Fixed patches that grow on surfaces
// ============================================================

class AlgaePatch {
    constructor(x, y, radius = 20) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.type = 'algae';
        this.energyValue = 4;
        this.density = 1.0;  // 0-1, how much algae is left
        this.regrowthRate = 0.08;  // per second
        this.maxDensity = 1.0;
        this.bites = [];  // track eaten areas for visuals
        this.hue = Math.random() * 30 + 90;  // green-yellow range
    }

    /**
     * Check if a position can eat from this patch
     */
    canEat(x, y) {
        const dist = Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2);
        return dist < this.radius && this.density > 0.2;
    }

    /**
     * Consume algae at a position
     */
    eat() {
        if (this.density > 0.2) {
            this.density -= 0.15;
            if (this.density < 0) this.density = 0;
            return this.energyValue;
        }
        return 0;
    }

    /**
     * Regrow over time
     */
    update(dt) {
        if (this.density < this.maxDensity) {
            this.density += this.regrowthRate * dt;
            if (this.density > this.maxDensity) {
                this.density = this.maxDensity;
            }
        }
    }

    draw(ctx, time) {
        if (this.density < 0.1) return;  // nearly gone

        ctx.save();
        ctx.globalAlpha = this.density * 0.8;

        // Base patch
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        grad.addColorStop(0, `hsl(${this.hue}, 60%, 45%)`);
        grad.addColorStop(0.6, `hsl(${this.hue}, 50%, 35%)`);
        grad.addColorStop(1, `hsl(${this.hue}, 40%, 25%)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * this.density, 0, Math.PI * 2);
        ctx.fill();

        // Add texture (small dots)
        ctx.fillStyle = `hsl(${this.hue}, 70%, 55%)`;
        const dotCount = Math.floor(this.density * 12);
        for (let i = 0; i < dotCount; i++) {
            const angle = (i / dotCount) * Math.PI * 2 + time * 0.1;
            const dist = Math.random() * this.radius * this.density * 0.7;
            const dx = this.x + Math.cos(angle) * dist;
            const dy = this.y + Math.sin(angle) * dist;
            ctx.beginPath();
            ctx.arc(dx, dy, 1 + Math.random(), 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// ============================================================
// DETRITUS - Settling organic matter
// ============================================================

class Detritus {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = 15 + Math.random() * 10;  // falls downward
        this.radius = 2;
        this.type = 'detritus';
        this.energyValue = 3;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 2;
        this.settled = false;
        this.settleY = 0;
    }

    update(dt, canvasWidth, canvasHeight) {
        if (this.settled) return;

        // Fall and drift
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.rotation += this.rotationSpeed * dt;

        // Wrap horizontally
        if (this.x < -10) this.x = canvasWidth + 10;
        if (this.x > canvasWidth + 10) this.x = -10;

        // Settle on bottom
        if (this.y > canvasHeight - 80) {
            this.settled = true;
            this.settleY = canvasHeight - 80 + (Math.random() - 0.5) * 20;
            this.y = this.settleY;
            this.vx = 0;
            this.vy = 0;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Draw as small brown particles
        ctx.fillStyle = '#8b7355';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius * 1.5, this.radius, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// ============================================================
// Food Manager
// ============================================================

const FoodManager = {
    plankton: [],
    algae: [],
    detritus: [],

    reset() {
        this.plankton = [];
        this.algae = [];
        this.detritus = [];
    },

    /**
     * Generate initial food sources
     */
    generate(canvasWidth, canvasHeight) {
        this.reset();

        // Plankton scattered throughout
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * canvasWidth;
            const y = Math.random() * canvasHeight;
            this.plankton.push(new Plankton(x, y));
        }

        // Algae patches on surfaces (bottom and mid-level)
        for (let i = 0; i < 12; i++) {
            const x = 60 + Math.random() * (canvasWidth - 120);
            const y = canvasHeight * 0.5 + Math.random() * (canvasHeight * 0.45);
            const radius = 15 + Math.random() * 15;
            this.algae.push(new AlgaePatch(x, y, radius));
        }

        // Initial detritus
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * canvasWidth;
            const y = Math.random() * canvasHeight * 0.6;
            this.detritus.push(new Detritus(x, y));
        }
    },

    /**
     * Maintain food populations
     */
    maintain(canvasWidth, canvasHeight) {
        // Maintain plankton count
        if (this.plankton.length < 25) {
            const x = Math.random() * canvasWidth;
            const y = Math.random() * canvasHeight;
            this.plankton.push(new Plankton(x, y));
        }

        // Add new detritus occasionally
        if (this.detritus.length < 15 && Math.random() < 0.02) {
            const x = Math.random() * canvasWidth;
            const y = -10;
            this.detritus.push(new Detritus(x, y));
        }
    },

    /**
     * Update all food sources
     */
    update(dt, canvasWidth, canvasHeight, time) {
        // Update plankton
        for (const p of this.plankton) {
            p.update(dt, canvasWidth, canvasHeight);
        }

        // Update algae (regrowth)
        for (const a of this.algae) {
            a.update(dt);
        }

        // Update detritus
        for (const d of this.detritus) {
            d.update(dt, canvasWidth, canvasHeight);
        }

        // Maintain populations
        this.maintain(canvasWidth, canvasHeight);
    },

    /**
     * Draw all food sources
     */
    draw(ctx, time) {
        // Draw detritus (behind everything)
        for (const d of this.detritus) {
            d.draw(ctx);
        }

        // Draw algae (on surfaces)
        for (const a of this.algae) {
            a.draw(ctx, time);
        }

        // Draw plankton (floating)
        for (const p of this.plankton) {
            p.draw(ctx, time);
        }
    },

    /**
     * Check collision with player and return food if eaten
     */
    checkPlayerCollision(player) {
        const results = [];

        // Check plankton
        for (let i = this.plankton.length - 1; i >= 0; i--) {
            const p = this.plankton[i];
            const dist = Math.sqrt((player.x - p.x) ** 2 + (player.y - p.y) ** 2);
            if (dist < player.radius + p.radius) {
                results.push({ type: 'plankton', value: p.energyValue, x: p.x, y: p.y });
                this.plankton.splice(i, 1);
            }
        }

        // Check algae patches
        for (const a of this.algae) {
            if (a.canEat(player.x, player.y)) {
                const value = a.eat();
                if (value > 0) {
                    results.push({ type: 'algae', value, x: a.x, y: a.y });
                }
            }
        }

        // Check detritus
        for (let i = this.detritus.length - 1; i >= 0; i--) {
            const d = this.detritus[i];
            const dist = Math.sqrt((player.x - d.x) ** 2 + (player.y - d.y) ** 2);
            if (dist < player.radius + d.radius) {
                results.push({ type: 'detritus', value: d.energyValue, x: d.x, y: d.y });
                this.detritus.splice(i, 1);
            }
        }

        return results;
    }
};
