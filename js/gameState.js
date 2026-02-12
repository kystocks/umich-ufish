/**
 * Manages game state transitions and screen overlays.
 * States: 'menu' | 'playing' | 'gameOver' | 'advancing'
 */
class GameState {
    constructor() {
        this.state = 'menu';
        this.score = 0;
        this.timeAlive = 0;
        this.deathCause = '';

        // Species advancement screen
        this.advancementTimer = 0;
        this.advancementDuration = 3;  // 3 seconds
        this.newSpeciesName = '';

        // Listen for Enter key to transition states
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (this.state === 'menu') {
                    this.start();
                } else if (this.state === 'gameOver') {
                    this.restart();
                }
            }
        });

        // Callbacks set by game.js
        this.onStart = null;
        this.onRestart = null;
    }

    start() {
        this.state = 'playing';
        this.score = 0;
        this.timeAlive = 0;
        this.deathCause = '';
        if (this.onStart) this.onStart();
    }

    restart() {
        this.state = 'playing';
        this.score = 0;
        this.timeAlive = 0;
        this.deathCause = '';
        if (this.onRestart) this.onRestart();
    }

    gameOver(cause = 'unknown') {
        this.state = 'gameOver';
        this.deathCause = cause;
    }

    /**
     * Trigger species advancement screen
     */
    triggerAdvancement(newSpeciesName) {
        this.state = 'advancing';
        this.advancementTimer = 0;
        this.newSpeciesName = newSpeciesName;
    }

    update(dt) {
        if (this.state === 'playing') {
            this.timeAlive += dt;
        } else if (this.state === 'advancing') {
            this.advancementTimer += dt;
            if (this.advancementTimer >= this.advancementDuration) {
                this.state = 'playing';
            }
        }
    }

    // --- Screen drawing ---

    drawMenu(ctx, w, h) {
        // Dim overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';

        // Title
        ctx.fillStyle = '#f0d060';
        ctx.font = 'bold 42px Georgia, serif';
        ctx.fillText('Odell Down Under', w / 2, h / 2 - 80);

        // Subtitle
        ctx.fillStyle = '#b0d8f0';
        ctx.font = '18px Georgia, serif';
        ctx.fillText('Survive the Great Barrier Reef', w / 2, h / 2 - 45);

        // Controls
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '15px monospace';
        ctx.fillText('WASD / Arrow Keys — Move', w / 2, h / 2 + 10);
        ctx.fillText('Eat appropriate prey to gain points', w / 2, h / 2 + 35);
        ctx.fillText('Progress through 10 species!', w / 2, h / 2 + 60);

        // Prompt
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px monospace';
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 400);
        ctx.globalAlpha = 0.5 + pulse * 0.5;
        ctx.fillText('Press ENTER to Start', w / 2, h / 2 + 110);
        ctx.globalAlpha = 1;

        ctx.textAlign = 'left';
    }

    drawGameOver(ctx, w, h, player) {
        // Dim overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';

        // Title
        ctx.fillStyle = '#e74c3c';
        ctx.font = 'bold 48px Georgia, serif';
        ctx.fillText('Game Over', w / 2, h / 2 - 70);

        // Cause
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '16px monospace';
        let cause = 'Unknown cause';
        if (this.deathCause === 'starvation') {
            cause = 'You starved!';
        } else if (this.deathCause === 'damage') {
            cause = 'Health depleted!';
        } else if (this.deathCause === 'predator') {
            cause = 'Eaten by a predator!';
        }
        ctx.fillText(cause, w / 2, h / 2 - 35);

        // Stats
        ctx.fillStyle = '#f0d060';
        ctx.font = '18px monospace';
        const mins = Math.floor(this.timeAlive / 60);
        const secs = Math.floor(this.timeAlive % 60);
        const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
        ctx.fillText(`Time Survived: ${timeStr}`, w / 2, h / 2 + 10);
        ctx.fillText(`Final Species: ${player.currentSpecies.name}`, w / 2, h / 2 + 40);
        ctx.fillText(`Points: ${player.points}`, w / 2, h / 2 + 70);

        // Restart prompt
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px monospace';
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 400);
        ctx.globalAlpha = 0.5 + pulse * 0.5;
        ctx.fillText('Press ENTER to Restart', w / 2, h / 2 + 120);
        ctx.globalAlpha = 1;

        ctx.textAlign = 'left';
    }

    /**
     * Species advancement screen
     */
    drawAdvancement(ctx, w, h) {
        // Dim overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';

        // Title
        ctx.fillStyle = '#2ecc71';
        ctx.font = 'bold 40px Georgia, serif';
        ctx.fillText('Species Advanced!', w / 2, h / 2 - 40);

        // New species name
        ctx.fillStyle = '#f0d060';
        ctx.font = 'bold 32px Georgia, serif';
        ctx.fillText(`You are now a ${this.newSpeciesName}`, w / 2, h / 2 + 20);

        // Fade effect
        const fadeProgress = Math.min(1, this.advancementTimer / 0.5);
        ctx.globalAlpha = fadeProgress;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '16px monospace';
        ctx.fillText('Continuing...', w / 2, h / 2 + 80);
        ctx.globalAlpha = 1;

        ctx.textAlign = 'left';
    }

    drawHUD(ctx, w, h, player) {
        const barX = 15;
        const barY = 15;
        const barW = 160;
        const barH = 16;
        const barSpacing = 22;

        // --- ENERGY BAR (Green) ---
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

        const energyPct = Math.max(0, player.energy / player.maxEnergy);
        let energyColor;
        if (energyPct > 0.5) energyColor = '#2ecc71';
        else if (energyPct > 0.25) energyColor = '#f39c12';
        else energyColor = '#e74c3c';

        ctx.fillStyle = energyColor;
        ctx.fillRect(barX, barY, barW * energyPct, barH);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`Energy: ${Math.ceil(player.energy)}`, barX + 4, barY + 12);

        // --- HEALTH BAR (Red) ---
        const healthY = barY + barSpacing;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(barX - 2, healthY - 2, barW + 4, barH + 4);

        const healthPct = Math.max(0, player.health / player.maxHealth);
        let healthColor;
        if (healthPct > 0.5) healthColor = '#e74c3c';
        else if (healthPct > 0.25) healthColor = '#c0392b';
        else healthColor = '#7f1919';

        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, healthY, barW * healthPct, barH);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`Health: ${Math.ceil(player.health)}`, barX + 4, healthY + 12);

        // --- SPECIES INFO ---
        const speciesY = healthY + barSpacing + 8;
        ctx.fillStyle = '#f0d060';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(player.currentSpecies.name, barX, speciesY);

        // Points progress
        const pointsY = speciesY + 16;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '11px monospace';
        if (player.currentSpecies.pointsToNext > 0) {
            ctx.fillText(
                `Points: ${player.points}/${player.currentSpecies.pointsToNext}`,
                barX,
                pointsY
            );
        } else {
            // Final species
            ctx.fillText(`Points: ${player.points} (MAX)`, barX, pointsY);
        }

        // Hidden indicator
        if (player.isHidden) {
            ctx.fillStyle = '#2ecc71';
            ctx.font = 'bold 11px monospace';
            ctx.fillText('HIDDEN', barX + barW + 10, barY + 12);
        }

        // --- TIME (Top-right) ---
        ctx.textAlign = 'right';
        const mins = Math.floor(this.timeAlive / 60);
        const secs = Math.floor(this.timeAlive % 60);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '14px monospace';
        ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, w - 15, 25);

        ctx.textAlign = 'left';
    }
}
