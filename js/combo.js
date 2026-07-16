// ============================================================
// combo.js — Gate combo multiplier system
// ============================================================

class ComboSystem {
    constructor(game) {
        this.game = game;
        this.count = 0;         // consecutive positive gates
        this.timer = 0;         // seconds since last positive gate
        this.WINDOW = 8.0;      // seconds before combo resets
        this.pops = [];         // floating number pop animations
    }

    reset() {
        this.count = 0;
        this.timer = 0;
    }

    // Call on positive gate hit
    onPositive() {
        this.count++;
        this.timer = this.WINDOW;
        const mult = this.getMultiplier();
        if (this.count >= 2) {
            // Trigger combo sound
            if (this.game.sound) this.game.sound.combo(this.count - 1);
            // Trigger combo pop UI
            const cx = GC.W / 2;
            const cy = GC.CROWD_SCREEN_Y - 60;
            this.addPop(cx, cy, `+COMBO ×${mult}!`, '#FFD700');
        }
        return mult;
    }

    // Call on negative gate hit
    onNegative() {
        if (this.count > 0) {
            this.addPop(GC.W / 2, GC.CROWD_SCREEN_Y - 60, 'COMBO BREAK!', '#FF4444');
        }
        this.reset();
    }

    getMultiplier() {
        if (this.count <= 1) return 1;
        if (this.count === 2) return 1.5;
        if (this.count === 3) return 2;
        return 3; // 4+ chain = 3x
    }

    // Add a floating number pop
    addPop(x, y, text, color) {
        this.pops.push({ x, y, text, color, life: 1.8, maxLife: 1.8, vy: -55 });
    }

    update(dt) {
        // Decay timer
        if (this.count > 0) {
            this.timer -= dt;
            if (this.timer <= 0) this.reset();
        }

        // Update pops
        for (let i = this.pops.length - 1; i >= 0; i--) {
            const p = this.pops[i];
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) this.pops.splice(i, 1);
        }
    }

    // Add a generic number pop (for crowd gains etc.)
    addNumberPop(x, y, text, color = '#00FF88') {
        this.pops.push({ x, y, text, color, life: 1.4, maxLife: 1.4, vy: -45 });
        if (this.game.sound) this.game.sound.numberPop();
    }

    draw(ctx) {
        for (const p of this.pops) {
            const alpha = Math.min(1, p.life / p.maxLife * 1.5);
            const scale = 1 + (1 - p.life / p.maxLife) * 0.3;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(p.x, p.y);
            ctx.scale(scale, scale);
            ctx.font = `bold 22px "Outfit", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 12;
            ctx.fillStyle = p.color;
            ctx.fillText(p.text, 0, 0);
            ctx.restore();
        }
    }
}
