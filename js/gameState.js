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

        // Pause state tracking
        this.pausedFromState = null;

        // Feedback modal state
        this.feedbackMessage = null;
        this.feedbackType = null;  // 'healthy' | 'unhealthy' | 'needsCleaner'

        // Species selection
        this.selectedSpeciesIndex = 0;  // Track current selection

        // Listen for Enter/Space key to transition states
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                if (this.state === 'menu') {
                    this.start();
                } else if (this.state === 'gameOver') {
                    this.restart();
                } else if (this.state === 'feedback') {
                    this.dismissFeedback();
                } else if (this.state === 'speciesSelect') {
                    this.beginGame();
                }
            } else if (e.key === 'Escape') {
                if (this.state === 'paused') {
                    this.unpause();
                } else if (this.state === 'playing') {
                    this.pause();
                } else if (this.state === 'speciesSelect') {
                    this.state = 'menu';
                }
            } else if (this.state === 'speciesSelect') {
                if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                    this.selectedSpeciesIndex = Math.max(0, this.selectedSpeciesIndex - 1);
                } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                    this.selectedSpeciesIndex = Math.min(9, this.selectedSpeciesIndex + 1);  // 0-9 for 10 species
                }
            }
        });

        // Listen for canvas clicks to transition states
        const canvas = document.getElementById('game-canvas');
        canvas.addEventListener('click', (e) => {
            if (this.state === 'menu') {
                this.start();
            } else if (this.state === 'gameOver') {
                this.restart();
            } else if (this.state === 'speciesSelect') {
                const rect = canvas.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;

                // Left arrow area (left third of screen)
                if (clickX < canvas.width / 3 && this.selectedSpeciesIndex > 0) {
                    this.selectedSpeciesIndex--;
                }
                // Right arrow area (right third of screen)
                else if (clickX > canvas.width * 2 / 3 && this.selectedSpeciesIndex < 9) {
                    this.selectedSpeciesIndex++;
                }
                // Center area - select and begin
                else {
                    this.beginGame();
                }
            }
        });

        // Callbacks set by game.js
        this.onStart = null;
        this.onRestart = null;
    }

    start() {
        this.state = 'speciesSelect';  // Go to selection first
        this.selectedSpeciesIndex = 0;  // Default to Silver Sprat
    }

    beginGame() {
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

    pause() {
        if (this.state === 'playing') {
            this.pausedFromState = this.state;
            this.state = 'paused';
        }
    }

    unpause() {
        if (this.state === 'paused') {
            this.state = this.pausedFromState || 'playing';
            this.pausedFromState = null;
        }
    }

    showFeedback(type, message) {
        this.pausedFromState = this.state;
        this.state = 'feedback';
        this.feedbackType = type;
        this.feedbackMessage = message;
    }

    dismissFeedback() {
        if (this.state === 'feedback') {
            this.state = this.pausedFromState || 'playing';
            this.pausedFromState = null;
            this.feedbackMessage = null;
            this.feedbackType = null;
        }
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
        ctx.fillText('Click or press ENTER/SPACE to Start', w / 2, h / 2 + 110);
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
        ctx.fillText('Click or press ENTER/SPACE to Restart', w / 2, h / 2 + 120);
        ctx.globalAlpha = 1;

        ctx.textAlign = 'left';
    }

    drawPaused(ctx, w, h) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 48px Georgia, serif';
        ctx.fillText('PAUSED', w / 2, h / 2);

        ctx.font = '20px monospace';
        ctx.fillText('Press ESC to resume', w / 2, h / 2 + 50);
        ctx.textAlign = 'left';
    }

    drawFeedback(ctx, w, h) {
        // Overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, w, h);

        // Modal box
        const boxW = 400, boxH = 180;
        const boxX = (w - boxW) / 2, boxY = (h - boxH) / 2;

        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = '#ecf0f1';
        ctx.lineWidth = 3;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Icon and color based on type
        ctx.textAlign = 'center';
        let color, icon;
        if (this.feedbackType === 'healthy') {
            color = '#2ecc71'; icon = '✓';
        } else if (this.feedbackType === 'unhealthy') {
            color = '#e74c3c'; icon = '✗';
        } else if (this.feedbackType === 'needsCleaner') {
            color = '#f39c12'; icon = '!';
        }

        ctx.fillStyle = color;
        ctx.font = 'bold 48px sans-serif';
        ctx.fillText(icon, w / 2, boxY + 60);

        // Message
        ctx.fillStyle = '#ecf0f1';
        ctx.font = '18px sans-serif';
        ctx.fillText(this.feedbackMessage, w / 2, boxY + 100);

        // Dismiss hint
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '14px monospace';
        ctx.fillText('Click or press Enter/Space to continue', w / 2, boxY + 140);

        ctx.textAlign = 'left';
    }

    drawSpeciesSelect(ctx, w, h) {
        // Import species data
        const species = SPECIES_DATA[this.selectedSpeciesIndex];

        // Dim overlay
        ctx.fillStyle = 'rgba(0, 20, 40, 0.85)';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';

        // Title
        ctx.fillStyle = '#f0d060';
        ctx.font = 'bold 36px Georgia, serif';
        ctx.fillText('Choose Your Species', w / 2, 60);

        // Species card
        const cardW = 400, cardH = 300;
        const cardX = (w - cardW) / 2, cardY = 100;

        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(cardX, cardY, cardW, cardH);
        ctx.strokeStyle = '#f0d060';
        ctx.lineWidth = 3;
        ctx.strokeRect(cardX, cardY, cardW, cardH);

        // Species name
        ctx.fillStyle = '#f0d060';
        ctx.font = 'bold 28px Georgia, serif';
        ctx.fillText(species.name, w / 2, cardY + 40);

        // Visual preview (simplified fish shape)
        ctx.fillStyle = species.color;
        ctx.beginPath();
        ctx.ellipse(w / 2, cardY + 100, species.width / 1.5, species.height / 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stats
        ctx.fillStyle = '#ecf0f1';
        ctx.font = '16px monospace';
        ctx.fillText(`Size: ${species.size.toUpperCase()}`, w / 2, cardY + 160);
        ctx.fillText(`Speed: ${species.speed}`, w / 2, cardY + 185);
        ctx.fillText(`Agility: ${species.agility} | Endurance: ${species.endurance}`, w / 2, cardY + 210);

        // Diet (truncate if too long)
        const dietText = species.diet.slice(0, 4).join(', ') + (species.diet.length > 4 ? '...' : '');
        ctx.fillText(`Diet: ${dietText}`, w / 2, cardY + 235);

        // Navigation arrows
        if (this.selectedSpeciesIndex > 0) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 48px sans-serif';
            ctx.fillText('←', cardX - 50, cardY + cardH / 2 + 15);
        }
        if (this.selectedSpeciesIndex < 9) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 48px sans-serif';
            ctx.fillText('→', cardX + cardW + 50, cardY + cardH / 2 + 15);
        }

        // Species counter
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '14px monospace';
        ctx.fillText(`${this.selectedSpeciesIndex + 1} / 10`, w / 2, cardY + cardH + 25);

        // Instructions
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '16px monospace';
        ctx.fillText('← → or A/D to browse | Click arrows to navigate', w / 2, h - 80);
        ctx.fillText('ENTER/SPACE or click center to select', w / 2, h - 55);
        ctx.fillText('ESC to go back', w / 2, h - 30);

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

    updateHUD(player, worldGrid) {
        // Energy bar
        const energyPct = Math.max(0, player.energy / player.maxEnergy);
        const energyFill = document.getElementById('energy-fill');
        const energyValue = document.getElementById('energy-value');
        if (energyFill && energyValue) {
            energyFill.style.width = (energyPct * 100) + '%';
            energyValue.textContent = Math.ceil(player.energy);
        }

        // Health bar
        const healthPct = Math.max(0, player.health / player.maxHealth);
        const healthFill = document.getElementById('health-fill');
        const healthValue = document.getElementById('health-value');
        if (healthFill && healthValue) {
            healthFill.style.width = (healthPct * 100) + '%';
            healthValue.textContent = Math.ceil(player.health);
        }

        // Species info
        const speciesName = document.getElementById('species-name');
        const pointsDisplay = document.getElementById('points-display');
        if (speciesName && pointsDisplay) {
            speciesName.textContent = player.currentSpecies.name;
            if (player.currentSpecies.pointsToNext > 0) {
                pointsDisplay.textContent = `Points: ${player.points}/${player.currentSpecies.pointsToNext}`;
            } else {
                pointsDisplay.textContent = `Points: ${player.points} (MAX)`;
            }
        }

        // Hidden indicator
        const hiddenIndicator = document.getElementById('hidden-indicator');
        if (hiddenIndicator) {
            hiddenIndicator.style.display = player.isHidden ? 'block' : 'none';
        }

        // Time
        const timeDisplay = document.getElementById('time-display');
        if (timeDisplay) {
            const mins = Math.floor(this.timeAlive / 60);
            const secs = Math.floor(this.timeAlive % 60);
            timeDisplay.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        // Zone
        const zoneDisplay = document.getElementById('zone-display');
        if (zoneDisplay && worldGrid) {
            const zoneName = worldGrid.getCurrentZone()?.name || 'Unknown';
            zoneDisplay.textContent = zoneName;
        }
    }
}
