/**
 * World Grid - 3x3 zone system for Odell Down Under
 * Each zone has unique characteristics and species populations
 */

class WorldGrid {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.currentZone = { x: 1, y: 1 };  // Start in center zone
        this.transitionActive = false;
        this.transitionProgress = 0;
        this.transitionDuration = 0.5;  // seconds
        this.transitionFrom = { x: 1, y: 1 };
        this.transitionTo = { x: 1, y: 1 };

        // Define all 9 zones
        this.zones = this.createZones();
    }

    createZones() {
        return {
            // TOP ROW (Shallow - Reef Crest)
            '0,0': {
                name: 'Northwest Shallows',
                depth: 'shallow',
                biome: 'reef',
                lightLevel: 1.0,
                waterColor: { start: '#1a8fcc', mid: '#1776a8', end: '#145884' },
                species: {
                    plankton: { min: 8, max: 12 },
                    shrimp: { min: 3, max: 5 },
                    smallFish: { min: 4, max: 6 },
                    mediumPredator: { min: 1, max: 2 },
                }
            },
            '1,0': {
                name: 'North Reef',
                depth: 'shallow',
                biome: 'coral-rich',
                lightLevel: 1.0,
                waterColor: { start: '#1a8fcc', mid: '#1776a8', end: '#145884' },
                species: {
                    plankton: { min: 10, max: 15 },
                    shrimp: { min: 4, max: 6 },
                    smallFish: { min: 5, max: 7 },
                    mediumPredator: { min: 1, max: 1 },
                }
            },
            '2,0': {
                name: 'Northeast Shallows',
                depth: 'shallow',
                biome: 'kelp',
                lightLevel: 0.95,
                waterColor: { start: '#1a8fcc', mid: '#1776a8', end: '#145884' },
                species: {
                    plankton: { min: 7, max: 10 },
                    shrimp: { min: 2, max: 4 },
                    smallFish: { min: 3, max: 5 },
                    mediumPredator: { min: 1, max: 2 },
                }
            },

            // MIDDLE ROW (Mid-depth)
            '0,1': {
                name: 'West Waters',
                depth: 'mid',
                biome: 'open',
                lightLevel: 0.7,
                waterColor: { start: '#0e7abf', mid: '#0b5e8e', end: '#073b5c' },
                species: {
                    plankton: { min: 5, max: 8 },
                    shrimp: { min: 2, max: 3 },
                    smallFish: { min: 4, max: 6 },
                    mediumPredator: { min: 2, max: 3 },
                }
            },
            '1,1': {
                name: 'Central Reef',
                depth: 'mid',
                biome: 'mixed',
                lightLevel: 0.75,
                waterColor: { start: '#0e7abf', mid: '#0b5e8e', end: '#073b5c' },
                species: {
                    plankton: { min: 6, max: 10 },
                    shrimp: { min: 3, max: 5 },
                    smallFish: { min: 5, max: 7 },
                    mediumPredator: { min: 2, max: 3 },
                    largePredator: { min: 1, max: 1 },
                }
            },
            '2,1': {
                name: 'East Waters',
                depth: 'mid',
                biome: 'open',
                lightLevel: 0.7,
                waterColor: { start: '#0e7abf', mid: '#0b5e8e', end: '#073b5c' },
                species: {
                    plankton: { min: 5, max: 8 },
                    shrimp: { min: 2, max: 3 },
                    smallFish: { min: 4, max: 6 },
                    mediumPredator: { min: 2, max: 3 },
                }
            },

            // BOTTOM ROW (Deep - Sandy Bottom)
            '0,2': {
                name: 'Southwest Deep',
                depth: 'deep',
                biome: 'sandy',
                lightLevel: 0.4,
                waterColor: { start: '#0a5f8f', mid: '#084a6f', end: '#06354f' },
                species: {
                    plankton: { min: 3, max: 5 },
                    shrimp: { min: 3, max: 5 },
                    smallFish: { min: 2, max: 4 },
                    mediumPredator: { min: 2, max: 3 },
                    largePredator: { min: 1, max: 2 },
                }
            },
            '1,2': {
                name: 'Southern Trench',
                depth: 'deep',
                biome: 'rocky',
                lightLevel: 0.35,
                waterColor: { start: '#0a5f8f', mid: '#084a6f', end: '#06354f' },
                species: {
                    plankton: { min: 2, max: 4 },
                    shrimp: { min: 2, max: 3 },
                    smallFish: { min: 2, max: 3 },
                    mediumPredator: { min: 3, max: 4 },
                    largePredator: { min: 1, max: 2 },
                }
            },
            '2,2': {
                name: 'Southeast Deep',
                depth: 'deep',
                biome: 'cave',
                lightLevel: 0.3,
                waterColor: { start: '#0a5f8f', mid: '#084a6f', end: '#06354f' },
                species: {
                    plankton: { min: 2, max: 3 },
                    shrimp: { min: 3, max: 4 },
                    smallFish: { min: 2, max: 3 },
                    mediumPredator: { min: 2, max: 3 },
                    largePredator: { min: 2, max: 2 },
                }
            },
        };
    }

    getCurrentZone() {
        return this.zones[`${this.currentZone.x},${this.currentZone.y}`];
    }

    getZoneKey(x, y) {
        return `${x},${y}`;
    }

    /**
     * Check if player is at zone edge and should transition
     */
    checkZoneTransition(player) {
        if (this.transitionActive) return null;

        const edgeThreshold = 20;
        let newX = this.currentZone.x;
        let newY = this.currentZone.y;

        // Check horizontal edges (WRAPS east-west)
        if (player.x < edgeThreshold) {
            newX = (this.currentZone.x - 1 + 3) % 3;  // move left, wrap
        } else if (player.x > this.canvasWidth - edgeThreshold) {
            newX = (this.currentZone.x + 1) % 3;  // move right, wrap
        }

        // Check vertical edges (only transition if not at outer boundary)
        if (player.y < edgeThreshold && this.currentZone.y > 0) {
            newY = this.currentZone.y - 1;  // move up
        } else if (player.y > this.canvasHeight - edgeThreshold && this.currentZone.y < 2) {
            newY = this.currentZone.y + 1;  // move down
        }

        // Trigger transition if zone changed
        if (newX !== this.currentZone.x || newY !== this.currentZone.y) {
            return { x: newX, y: newY };
        }

        return null;
    }

    /**
     * Start zone transition
     */
    startTransition(newZone, player) {
        this.transitionActive = true;
        this.transitionProgress = 0;
        this.transitionFrom = { ...this.currentZone };
        this.transitionTo = { ...newZone };

        // Reposition player on opposite edge
        const edgeBuffer = 30;
        if (newZone.x < this.currentZone.x) {
            // Moved left, appear on right edge
            player.x = this.canvasWidth - edgeBuffer;
        } else if (newZone.x > this.currentZone.x) {
            // Moved right, appear on left edge
            player.x = edgeBuffer;
        }

        if (newZone.y < this.currentZone.y) {
            // Moved up, appear on bottom edge
            player.y = this.canvasHeight - edgeBuffer;
        } else if (newZone.y > this.currentZone.y) {
            // Moved down, appear on top edge
            player.y = edgeBuffer;
        }

        this.currentZone = { ...newZone };
    }

    /**
     * Update transition animation
     */
    updateTransition(dt) {
        if (!this.transitionActive) return false;

        this.transitionProgress += dt / this.transitionDuration;
        if (this.transitionProgress >= 1) {
            this.transitionActive = false;
            this.transitionProgress = 0;
            return true;  // transition complete
        }

        return false;
    }

    /**
     * Apply boundary constraints based on current zone
     * Returns true if at an outer edge (hard boundary)
     */
    constrainPlayerToGrid(player, halfW, halfH) {
        let constrained = false;

        // East-West wraps, so NO horizontal boundaries

        // Top outer edge (zone *,0)
        if (this.currentZone.y === 0 && player.y < halfH) {
            player.y = halfH;
            player.vy = 0;
            constrained = true;
        }

        // Bottom outer edge (zone *,2)
        if (this.currentZone.y === 2 && player.y > this.canvasHeight - halfH) {
            player.y = this.canvasHeight - halfH;
            player.vy = 0;
            constrained = true;
        }

        return constrained;
    }

    /**
     * Draw zone name indicator
     */
    drawZoneIndicator(ctx) {
        const zone = this.getCurrentZone();

        ctx.save();

        // Draw zone name at top center
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(this.canvasWidth / 2 - 100, 10, 200, 30);

        ctx.fillStyle = '#f0d060';
        ctx.font = 'bold 15px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(zone.name, this.canvasWidth / 2, 25);

        ctx.restore();
    }

    /**
     * Draw mini-map
     */
    drawMiniMap(player) {
        const miniCanvas = document.getElementById('mini-map');
        if (!miniCanvas) return;

        const ctx = miniCanvas.getContext('2d');
        const cellSize = 30;  // 90px / 3 zones

        // Clear
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, 90, 90);

        // Draw grid
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++) {
                const zone = this.zones[`${x},${y}`];
                const px = x * cellSize;
                const py = y * cellSize;

                // Zone color based on depth
                let zoneColor;
                if (zone.depth === 'shallow') zoneColor = '#4a9fd8';
                else if (zone.depth === 'mid') zoneColor = '#2b7cb0';
                else zoneColor = '#1a4d6f';

                // Zone cell
                ctx.fillStyle = zoneColor;
                ctx.fillRect(px, py, cellSize, cellSize);

                // Current zone highlight
                if (this.currentZone.x === x && this.currentZone.y === y) {
                    ctx.strokeStyle = '#f0d060';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
                } else {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(px, py, cellSize, cellSize);
                }
            }
        }

        // Player dot
        if (player) {
            const playerGridX = (player.x / this.zoneWidth) * cellSize;
            const playerGridY = (player.y / this.zoneHeight) * cellSize;
            ctx.fillStyle = '#f0d060';
            ctx.beginPath();
            ctx.arc(playerGridX, playerGridY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
