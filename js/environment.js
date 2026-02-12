/**
 * Environment system — hiding spots (coral, caves, seaweed) and decorations.
 * The player's primary defense against predators.
 */

class HidingSpot {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.radius = config.radius;
        this.type = config.type; // 'coral' | 'cave' | 'seaweed'
        this.seed = Math.floor(config.x * 100 + config.y); // deterministic variation
    }
}

const Environment = {
    hidingSpots: [],
    decorations: [],

    reset() {
        this.hidingSpots = [];
        this.decorations = [];
    },

    /**
     * Procedurally generate hiding spots for the play area.
     * Uses deterministic seed for consistent zone layouts.
     */
    generate(cw, ch, zoneSeed = 0) {
        this.reset();

        // Seeded random number generator
        let seed = zoneSeed;
        const seededRandom = () => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };

        // --- Coral formations (bottom third) ---
        const coralCount = 4 + Math.floor(seededRandom() * 3); // 4-6
        for (let i = 0; i < coralCount; i++) {
            for (let attempt = 0; attempt < 15; attempt++) {
                const x = 80 + seededRandom() * (cw - 160);
                const y = ch * 0.6 + seededRandom() * (ch * 0.3 - 30);
                const scale = 0.7 + seededRandom() * 0.6; // 0.7x to 1.3x scale
                if (this._isValidPlacement(x, y, cw, ch)) {
                    const spot = new HidingSpot({
                        x, y, radius: 35, type: 'coral',
                    });
                    spot.scale = scale;
                    this.hidingSpots.push(spot);
                    break;
                }
            }
        }

        // --- Caves (bottom edge) ---
        const caveCount = 1 + Math.floor(seededRandom() * 2); // 1-2
        for (let i = 0; i < caveCount; i++) {
            for (let attempt = 0; attempt < 15; attempt++) {
                const x = 120 + seededRandom() * (cw - 240);
                const y = ch - 30;
                const scale = 0.8 + seededRandom() * 0.5; // 0.8x to 1.3x scale
                if (this._isValidPlacement(x, y, cw, ch)) {
                    const spot = new HidingSpot({
                        x, y, radius: 45, type: 'cave',
                    });
                    spot.scale = scale;
                    this.hidingSpots.push(spot);
                    break;
                }
            }
        }

        // --- Seaweed clusters (mid-lower) ---
        const seaweedCount = 2 + Math.floor(seededRandom() * 2); // 2-3
        for (let i = 0; i < seaweedCount; i++) {
            for (let attempt = 0; attempt < 15; attempt++) {
                const x = 60 + seededRandom() * (cw - 120);
                const y = ch * 0.45 + seededRandom() * (ch * 0.35);
                const scale = 0.6 + seededRandom() * 0.8; // 0.6x to 1.4x scale
                if (this._isValidPlacement(x, y, cw, ch)) {
                    const spot = new HidingSpot({
                        x, y, radius: 30, type: 'seaweed',
                    });
                    spot.scale = scale;
                    this.hidingSpots.push(spot);
                    break;
                }
            }
        }

        // --- Background decorations (non-interactive) ---
        for (let i = 0; i < 8; i++) {
            this.decorations.push({
                x: 40 + seededRandom() * (cw - 80),
                y: ch * 0.5 + seededRandom() * (ch * 0.45),
                size: 8 + seededRandom() * 15,
                hue: seededRandom(),
            });
        }
    },

    _isValidPlacement(x, y, cw, ch) {
        // Not too close to canvas center (player spawn)
        const cx = cw / 2, cy = ch / 2;
        if (Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) < 120) return false;

        // Not too close to other hiding spots
        for (const spot of this.hidingSpots) {
            if (Math.sqrt((x - spot.x) ** 2 + (y - spot.y) ** 2) < 100) return false;
        }
        return true;
    },

    /**
     * Check if player overlaps any hiding spot and update player state.
     */
    checkPlayerHiding(player) {
        player.isHidden = false;
        player.currentHidingSpot = null;
        for (const spot of this.hidingSpots) {
            if (distanceBetween(player, spot) < spot.radius) {
                player.isHidden = true;
                player.currentHidingSpot = spot;
                return;
            }
        }
    },

    // ========================================================
    // DRAWING — Back layer (rendered before fish)
    // ========================================================
    drawBack(ctx, time) {
        // Background decorations (distant coral silhouettes)
        for (const dec of this.decorations) {
            ctx.save();
            ctx.globalAlpha = 0.08;
            ctx.fillStyle = dec.hue > 0.5 ? '#e74c3c' : '#f39c12';
            ctx.beginPath();
            ctx.ellipse(dec.x, dec.y, dec.size, dec.size * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Draw hiding spots — back layer
        for (const spot of this.hidingSpots) {
            if (spot.type === 'seaweed') this._drawSeaweed(ctx, spot, time);
            if (spot.type === 'coral') this._drawCoralBack(ctx, spot);
            if (spot.type === 'cave') this._drawCaveBack(ctx, spot);
        }
    },

    // ========================================================
    // DRAWING — Front layer (rendered after player)
    // ========================================================
    drawFront(ctx, time) {
        for (const spot of this.hidingSpots) {
            if (spot.type === 'coral') this._drawCoralFront(ctx, spot);
            if (spot.type === 'cave') this._drawCaveFront(ctx, spot);
        }
    },

    // --- Seaweed ---
    _drawSeaweed(ctx, spot, time) {
        ctx.save();
        ctx.translate(spot.x, spot.y);
        const scale = spot.scale || 1;
        ctx.scale(scale, scale);
        ctx.translate(-spot.x, -spot.y);

        const strandCount = 4 + (spot.seed % 3);
        for (let i = 0; i < strandCount; i++) {
            const offsetX = (i - strandCount / 2) * 8;
            const height = 40 + (spot.seed * (i + 1) % 30);
            const sway = Math.sin(time * 1.5 + i * 1.2 + spot.seed) * 8;

            const green = i % 2 === 0 ? '#2ecc71' : '#27ae60';
            ctx.strokeStyle = green;
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(spot.x + offsetX, spot.y + 15);
            ctx.quadraticCurveTo(
                spot.x + offsetX + sway, spot.y - height / 2,
                spot.x + offsetX + sway * 0.7, spot.y - height
            );
            ctx.stroke();

            // Small leaf blobs
            ctx.fillStyle = green;
            ctx.globalAlpha = 0.6;
            for (let j = 1; j <= 3; j++) {
                const t = j / 4;
                const lx = spot.x + offsetX + sway * t * 0.7;
                const ly = spot.y + 15 - height * t;
                ctx.beginPath();
                ctx.ellipse(lx + (j % 2 === 0 ? 3 : -3), ly, 3, 1.5, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
        ctx.restore();
    },

    // --- Coral ---
    _drawCoralBack(ctx, spot) {
        ctx.save();
        ctx.translate(spot.x, spot.y);
        const scale = spot.scale || 1;
        ctx.scale(scale, scale);
        ctx.translate(-spot.x, -spot.y);

        const colors = ['#e74c3c', '#f39c12', '#e91e63', '#ff7043', '#d63384'];
        const branchCount = 3 + (spot.seed % 3);

        // Base
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.ellipse(spot.x, spot.y + 10, spot.radius * 0.8, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Branches
        for (let i = 0; i < branchCount; i++) {
            const offsetX = (i - branchCount / 2) * 12 + (spot.seed % 5 - 2);
            const height = 20 + ((spot.seed * (i + 1)) % 25);
            const bw = 6 + (i % 3) * 2;
            const color = colors[(spot.seed + i) % colors.length];

            ctx.fillStyle = color;
            // Branch stem (rounded rect approximation)
            ctx.beginPath();
            ctx.moveTo(spot.x + offsetX - bw / 2, spot.y + 5);
            ctx.lineTo(spot.x + offsetX - bw / 2 + 1, spot.y - height);
            ctx.lineTo(spot.x + offsetX + bw / 2 - 1, spot.y - height);
            ctx.lineTo(spot.x + offsetX + bw / 2, spot.y + 5);
            ctx.closePath();
            ctx.fill();

            // Rounded tip
            ctx.beginPath();
            ctx.arc(spot.x + offsetX, spot.y - height, bw / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    },

    _drawCoralFront(ctx, spot) {
        // Small foreground coral tips that overlap the player
        ctx.save();
        ctx.translate(spot.x, spot.y);
        const scale = spot.scale || 1;
        ctx.scale(scale, scale);
        ctx.translate(-spot.x, -spot.y);

        ctx.globalAlpha = 0.7;
        const color = ['#e74c3c', '#f39c12'][(spot.seed) % 2];
        ctx.fillStyle = color;

        // 2 small foreground pieces
        ctx.beginPath();
        ctx.arc(spot.x - 8, spot.y - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(spot.x + 10, spot.y - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    // --- Cave ---
    _drawCaveBack(ctx, spot) {
        ctx.save();
        ctx.translate(spot.x, spot.y);
        const scale = spot.scale || 1;
        ctx.scale(scale, scale);
        ctx.translate(-spot.x, -spot.y);

        // Cave arch
        ctx.fillStyle = '#3d2b1f';
        ctx.beginPath();
        ctx.arc(spot.x, spot.y, spot.radius * 0.9, Math.PI, 0);
        ctx.lineTo(spot.x + spot.radius * 0.9, spot.y + 10);
        ctx.lineTo(spot.x - spot.radius * 0.9, spot.y + 10);
        ctx.closePath();
        ctx.fill();

        // Darker interior
        ctx.fillStyle = '#1a0f0a';
        ctx.beginPath();
        ctx.arc(spot.x, spot.y, spot.radius * 0.6, Math.PI, 0);
        ctx.lineTo(spot.x + spot.radius * 0.6, spot.y + 5);
        ctx.lineTo(spot.x - spot.radius * 0.6, spot.y + 5);
        ctx.closePath();
        ctx.fill();

        // Rock details on sides
        ctx.fillStyle = '#5c4033';
        ctx.beginPath();
        ctx.arc(spot.x - spot.radius * 0.7, spot.y + 2, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(spot.x + spot.radius * 0.8, spot.y + 3, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },

    _drawCaveFront(ctx, spot) {
        // Small rock overhang at top
        ctx.save();
        ctx.translate(spot.x, spot.y);
        const scale = spot.scale || 1;
        ctx.scale(scale, scale);
        ctx.translate(-spot.x, -spot.y);

        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#4a3728';
        ctx.beginPath();
        ctx.arc(spot.x, spot.y - spot.radius * 0.5, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },
};
