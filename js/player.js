class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.acceleration = 600;   // pixels per second squared
        this.friction = 0.92;      // velocity multiplier per frame

        // Species progression
        this.currentSpeciesIndex = 0;
        this.currentSpecies = getSpeciesByIndex(0);  // Start with Silver Sprat
        this.points = 0;
        this.loadSpeciesAttributes();

        // Dual meter system
        this.energy = 100;
        this.maxEnergy = 100;
        this.energyDepleteRate = 1; // per second
        this.hiddenEnergyMultiplier = 1.2; // faster drain while hiding

        this.health = 100;
        this.maxHealth = 100;
        this.healthDepleteRate = 0.5; // slow constant health drain per second

        // Hiding state (set by Environment.checkPlayerHiding)
        this.isHidden = false;
        this.currentHidingSpot = null;

        // Track which keys are held
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
        };

        // Mouse following
        this.mouseX = null;
        this.mouseY = null;
        this.mouseActive = false;

        // Click-to-eat target
        this.targetX = null;
        this.targetY = null;
        this.hasTarget = false;

        this._bindKeys();
        this._bindMouse();
    }

    /**
     * Load attributes from current species data
     */
    loadSpeciesAttributes() {
        const species = this.currentSpecies;
        this.width = species.width;
        this.height = species.height;
        this.radius = species.radius;
        this.maxSpeed = species.speed;
        this.color = species.color;
        this.tailColor = species.tailColor;
        this.diet = species.diet;
        this.timeOfDay = species.timeOfDay;
        this.abilities = species.abilities || [];
        this.canHideInCoral = species.canHideInCoral;
        this.canHideInCaves = species.canHideInCaves;
        this.canHideInGrass = species.canHideInGrass;
        this.immuneToPoison = species.immuneToPoison || false;
    }

    /**
     * Advance to next species when point threshold reached
     */
    advanceSpecies() {
        const nextIndex = this.currentSpeciesIndex + 1;
        if (nextIndex >= SPECIES_DATA.length) {
            return false;  // Already at final species
        }

        this.currentSpeciesIndex = nextIndex;
        this.currentSpecies = getSpeciesByIndex(nextIndex);
        this.loadSpeciesAttributes();

        // Reset points for next advancement
        this.points = 0;

        return true;
    }

    /**
     * Check if player has enough points to advance
     */
    canAdvance() {
        return this.points >= this.currentSpecies.pointsToNext &&
               this.currentSpecies.pointsToNext > 0;
    }

    /**
     * Check if species can eat this food type
     */
    canEatFood(foodType) {
        return canEat(this.currentSpecies.id, foodType);
    }

    /**
     * Eat food and gain energy/health
     */
    eat(foodType, foodValue) {
        // Get food data
        const food = FOOD_TYPES[foodType];
        if (!food) {
            // Direct energy value (for prey fish)
            this.energy = Math.min(this.maxEnergy, this.energy + foodValue);
            this.points += Math.floor(foodValue * 1.5);  // Award points
            return;
        }

        // Apply energy gain
        this.energy = Math.min(this.maxEnergy, this.energy + food.energyValue);

        // Apply health impact (poison)
        if (food.healthImpact < 0 && !this.immuneToPoison) {
            this.health = Math.max(0, this.health + food.healthImpact);
        } else if (food.healthImpact < 0 && this.immuneToPoison) {
            // Immune to poison - no health damage
        }

        // Award points
        const pointValue = food.energyValue * 2;
        this.points += pointValue;
    }

    /**
     * Restore health (from cleaner species)
     */
    restoreHealth(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    /**
     * Take damage
     */
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
    }

    /**
     * Deplete energy over time
     */
    depleteEnergy(dt) {
        const mult = this.isHidden ? this.hiddenEnergyMultiplier : 1;
        this.energy -= this.energyDepleteRate * mult * dt;
        if (this.energy < 0) this.energy = 0;
    }

    /**
     * Deplete health over time (constant slow drain)
     */
    depleteHealth(dt) {
        this.health -= this.healthDepleteRate * dt;
        if (this.health < 0) this.health = 0;
    }

    /**
     * Reset player for new game
     */
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.currentSpeciesIndex = 0;
        this.currentSpecies = getSpeciesByIndex(0);
        this.loadSpeciesAttributes();
        this.points = 0;
        this.energy = this.maxEnergy;
        this.health = this.maxHealth;
        this.isHidden = false;
        this.currentHidingSpot = null;
    }

    _bindKeys() {
        window.addEventListener('keydown', (e) => this._handleKey(e, true));
        window.addEventListener('keyup', (e) => this._handleKey(e, false));
    }

    _handleKey(e, pressed) {
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.keys.up = pressed;
                e.preventDefault();
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                this.keys.down = pressed;
                e.preventDefault();
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.keys.left = pressed;
                e.preventDefault();
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.keys.right = pressed;
                e.preventDefault();
                break;
        }
    }

    _bindMouse() {
        const canvas = document.getElementById('game-canvas');

        // Track mouse position always (even outside canvas)
        const updateMouse = (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
            this.mouseActive = true;
        };

        canvas.addEventListener('mousemove', updateMouse);

        // Continue tracking even when mouse leaves canvas
        document.addEventListener('mousemove', (e) => {
            if (this.mouseActive) {
                const rect = canvas.getBoundingClientRect();
                this.mouseX = e.clientX - rect.left;
                this.mouseY = e.clientY - rect.top;
            }
        });

        // Click to set target for eating
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.targetX = e.clientX - rect.left;
            this.targetY = e.clientY - rect.top;
            this.hasTarget = true;

            // Emit click event for game.js to handle fish freezing
            const clickEvent = new CustomEvent('gameclick', {
                detail: { x: this.targetX, y: this.targetY }
            });
            canvas.dispatchEvent(clickEvent);
        });

        canvas.addEventListener('mouseenter', () => {
            this.mouseActive = true;
        });
    }

    update(dt, canvasWidth, canvasHeight, worldGrid = null) {
        // Deplete energy and health
        this.depleteEnergy(dt);
        this.depleteHealth(dt);

        // Apply acceleration based on input
        let ax = 0;
        let ay = 0;

        // Click target takes highest priority (swim to eat food)
        if (this.hasTarget && this.targetX !== null && this.targetY !== null) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Stop at target position
            if (dist > 25) {
                ax = dx / dist;
                ay = dy / dist;
                const speedMult = Math.min(1, dist / 100);
                ax *= speedMult;
                ay *= speedMult;
            } else {
                // Very close to target - slow down
                this.vx *= 0.85;
                this.vy *= 0.85;
            }
        }
        // Mouse control takes priority if active (and no click target)
        else if (this.mouseActive && this.mouseX !== null && this.mouseY !== null) {
            const dx = this.mouseX - this.x;
            const dy = this.mouseY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Stop at mouse position (larger dead zone)
            if (dist > 20) {
                // Direction toward mouse
                ax = dx / dist;
                ay = dy / dist;

                // Speed scales with distance (closer = slower, more precise)
                const speedMult = Math.min(1, dist / 100);
                ax *= speedMult;
                ay *= speedMult;
            } else {
                // Very close to mouse - stop completely
                this.vx *= 0.8;
                this.vy *= 0.8;
            }
        } else {
            // Keyboard control
            if (this.keys.left) ax -= 1;
            if (this.keys.right) ax += 1;
            if (this.keys.up) ay -= 1;
            if (this.keys.down) ay += 1;

            // Normalize diagonal movement
            if (ax !== 0 && ay !== 0) {
                const invSqrt2 = 1 / Math.SQRT2;
                ax *= invSqrt2;
                ay *= invSqrt2;
            }
        }

        this.vx += ax * this.acceleration * dt;
        this.vy += ay * this.acceleration * dt;

        // Apply friction when no input on that axis
        if (ax === 0) this.vx *= this.friction;
        if (ay === 0) this.vy *= this.friction;

        // Clamp to max speed (from species)
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }

        // Stop micro-drifting
        if (Math.abs(this.vx) < 0.5) this.vx = 0;
        if (Math.abs(this.vy) < 0.5) this.vy = 0;

        // Update position
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Apply grid boundaries (outer edges are hard walls, inner edges allow transitions)
        const halfW = this.width / 2;
        const halfH = this.height / 2;

        if (worldGrid) {
            // Use grid-aware boundaries
            worldGrid.constrainPlayerToGrid(this, halfW, halfH);
        } else {
            // Fallback to simple canvas bounds
            this.x = Math.max(halfW, Math.min(canvasWidth - halfW, this.x));
            this.y = Math.max(halfH, Math.min(canvasHeight - halfH, this.y));
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Flip fish to face movement direction
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
        ctx.moveTo(-this.width / 2, 0);
        ctx.lineTo(-this.width / 2 - 10, -8);
        ctx.lineTo(-this.width / 2 - 10, 8);
        ctx.closePath();
        ctx.fill();

        // Eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.width / 4, -3, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.width / 4 + 1, -3, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
