/**
 * Manages game state transitions and screen overlays.
 * States: 'menu' | 'playing' | 'gameOver'
 */
class GameState {
    constructor() {
        this.state = 'menu';
        this.score = 0;
        this.timeAlive = 0;

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
        if (this.onStart) this.onStart();
    }

    restart() {
        this.state = 'playing';
        this.score = 0;
        this.timeAlive = 0;
        if (this.onRestart) this.onRestart();
    }

    gameOver() {
        this.state = 'gameOver';
    }

    update(dt) {
        if (this.state === 'playing') {
            this.timeAlive += dt;
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
        ctx.fillText('Eat smaller fish to survive', w / 2, h / 2 + 35);
        ctx.fillText('Hide in coral to escape predators!', w / 2, h / 2 + 60);

        // Prompt
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px monospace';
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 400);
        ctx.globalAlpha = 0.5 + pulse * 0.5;
        ctx.fillText('Press ENTER to Start', w / 2, h / 2 + 110);
        ctx.globalAlpha = 1;

        ctx.textAlign = 'left';
    }

    drawGameOver(ctx, w, h, energy) {
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
        const cause = energy <= 0 ? 'You starved!' : 'Eaten by a predator!';
        ctx.fillText(cause, w / 2, h / 2 - 35);

        // Stats
        ctx.fillStyle = '#f0d060';
        ctx.font = '18px monospace';
        const mins = Math.floor(this.timeAlive / 60);
        const secs = Math.floor(this.timeAlive % 60);
        const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
        ctx.fillText(`Time Survived: ${timeStr}`, w / 2, h / 2 + 10);
        ctx.fillText(`Fish Eaten: ${this.score}`, w / 2, h / 2 + 40);

        // Restart prompt
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px monospace';
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 400);
        ctx.globalAlpha = 0.5 + pulse * 0.5;
        ctx.fillText('Press ENTER to Restart', w / 2, h / 2 + 90);
        ctx.globalAlpha = 1;

        ctx.textAlign = 'left';
    }

    drawHUD(ctx, w, h, energy, maxEnergy, isHidden) {
        // Energy bar background
        const barX = 15;
        const barY = 15;
        const barW = 180;
        const barH = 18;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

        // Energy bar fill
        const pct = Math.max(0, energy / maxEnergy);
        let barColor;
        if (pct > 0.5) barColor = '#2ecc71';
        else if (pct > 0.25) barColor = '#f39c12';
        else barColor = '#e74c3c';

        ctx.fillStyle = barColor;
        ctx.fillRect(barX, barY, barW * pct, barH);

        // Energy label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`Energy: ${Math.ceil(energy)}`, barX + 5, barY + 13);

        // Hidden indicator
        if (isHidden) {
            ctx.fillStyle = '#2ecc71';
            ctx.font = 'bold 12px monospace';
            ctx.fillText('HIDDEN', barX + barW + 12, barY + 13);
        }

        // Score (top-right)
        ctx.textAlign = 'right';
        ctx.fillStyle = '#f0d060';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`Score: ${this.score}`, w - 15, 30);

        // Time alive
        const mins = Math.floor(this.timeAlive / 60);
        const secs = Math.floor(this.timeAlive % 60);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '13px monospace';
        ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, w - 15, 50);

        ctx.textAlign = 'left';
    }
}
