class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 24;
        this.radius = 20;
        this.vx = 0;
        this.vy = 0;
        this.maxSpeed = 250;       // pixels per second
        this.acceleration = 600;   // pixels per second squared
        this.friction = 0.92;      // velocity multiplier per frame

        // Energy / hunger system
        this.energy = 100;
        this.maxEnergy = 100;
        this.energyDepleteRate = 1; // per second

        // Track which keys are held
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
        };

        this._bindKeys();
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.energy = this.maxEnergy;
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

    eat(amount) {
        this.energy = Math.min(this.maxEnergy, this.energy + amount);
    }

    depleteEnergy(dt) {
        this.energy -= this.energyDepleteRate * dt;
        if (this.energy < 0) this.energy = 0;
    }

    update(dt, canvasWidth, canvasHeight) {
        // Deplete energy
        this.depleteEnergy(dt);

        // Apply acceleration based on input
        let ax = 0;
        let ay = 0;

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

        this.vx += ax * this.acceleration * dt;
        this.vy += ay * this.acceleration * dt;

        // Apply friction when no input on that axis
        if (ax === 0) this.vx *= this.friction;
        if (ay === 0) this.vy *= this.friction;

        // Clamp to max speed
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

        // Clamp to canvas bounds
        const halfW = this.width / 2;
        const halfH = this.height / 2;
        this.x = Math.max(halfW, Math.min(canvasWidth - halfW, this.x));
        this.y = Math.max(halfH, Math.min(canvasHeight - halfH, this.y));
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Flip fish to face movement direction
        if (this.vx < -0.5) {
            ctx.scale(-1, 1);
        }

        // Body
        ctx.fillStyle = '#f0a030';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tail
        ctx.fillStyle = '#d08020';
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
