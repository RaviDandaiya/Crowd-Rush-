// ============================================================
// effects.js — Particle systems, screen shake, visual effects
// ============================================================

class Particle {
    constructor() { this.active = false; }
    reset(x, y, vx, vy, life, size, color, shape = 'circle', gravity = 200) {
        this.active = true;
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.gravity = gravity;
        this.life = life; this.maxLife = life;
        this.size = size; this.color = color;
        this.opacity = 1;
        this.rotation = Utils.randomRange(0, Math.PI * 2);
        this.rotSpeed = Utils.randomRange(-5, 5);
        this.shape = shape; this.shrink = true;
        this.glow = false;
        this.glowColor = color;
    }
    update(dt) {
        if (!this.active) return;
        this.x += this.vx * dt; this.y += this.vy * dt;
        this.vy += this.gravity * dt;
        this.life -= dt;
        this.opacity = Math.max(0, this.life / this.maxLife);
        this.rotation += this.rotSpeed * dt;
        if (this.life <= 0) this.active = false;
    }
    draw(ctx) {
        if (!this.active || this.opacity <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y);
         ctx.rotate(this.rotation);
        const s = this.shrink ? this.size * (0.3 + 0.7 * this.opacity) : this.size;
        if (this.glow) {
            ctx.shadowColor = this.glowColor;
            ctx.shadowBlur = s * 3;
        }
        ctx.fillStyle = this.color;
        if (this.shape === 'circle') {
            ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
        } else if (this.shape === 'square') {
            ctx.fillRect(-s, -s, s * 2, s * 2);
        } else if (this.shape === 'star') {
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const a1 = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                const a2 = ((i * 4 + 2) * Math.PI) / 5 - Math.PI / 2;
                ctx.lineTo(Math.cos(a1) * s, Math.sin(a1) * s);
                ctx.lineTo(Math.cos(a2) * s * 0.4, Math.sin(a2) * s * 0.4);
            }
            ctx.closePath(); ctx.fill();
        } else if (this.shape === 'brick') {
            // Fake 3D spinning brick
            const s1 = s * 1.5;
            const s2 = s * 0.8;
            ctx.fillStyle = this.color;
            ctx.fillRect(-s1, -s2, s1 * 2, s2 * 2);
            // Draw a darker edge to make it look like a 3D block
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(-s1, s2, s1 * 2, s2 * 0.5);
        } else if (this.shape === 'lightning') {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = s * 0.5;
            ctx.beginPath();
            ctx.moveTo(-s, -s);
            ctx.lineTo(0, 0);
            ctx.lineTo(s, -s * 0.5);
            ctx.stroke();
        }
        ctx.restore();
    }
}

class ParticleSystem {
    constructor(n = 1200) { this.pool = Array.from({length: n}, () => new Particle()); }
    get() { return this.pool.find(p => !p.active) || this.pool[0]; }
    update(dt) { this.pool.forEach(p => p.active && p.update(dt)); }
    draw(ctx) { this.pool.forEach(p => p.active && p.draw(ctx)); }

    burst(x, y, count, colors, speedMin, speedMax, lifeMin, lifeMax, sizeMin, sizeMax, shape, grav) {
        for (let i = 0; i < count; i++) {
            const p = this.get();
            const a = Utils.randomRange(0, Math.PI * 2);
            const sp = Utils.randomRange(speedMin, speedMax);
            p.reset(x + Utils.randomRange(-8, 8), y + Utils.randomRange(-8, 8),
                Math.cos(a) * sp, Math.sin(a) * sp - 60,
                Utils.randomRange(lifeMin, lifeMax),
                Utils.randomRange(sizeMin, sizeMax),
                colors[Utils.randomInt(0, colors.length - 1)],
                shape, grav);
        }
    }

    confetti(x, y, n = 40) {
        this.burst(x, y, n, ['#FF6B6B','#4ECDC4','#45B7D1','#FFEAA7','#DDA0DD','#FF69B4','#FFD700','#98FB98'],
            100, 350, 0.8, 1.8, 3, 7, 'square', 300);
    }
    clashSparks(x, y, n = 15) {
        this.burst(x, y, n, ['#FF4444','#FF6644','#FF8844','#FFAA44'], 50, 180, 0.3, 0.7, 2, 5, 'circle', 150);
        // Extra glow particles
        for (let i = 0; i < 5; i++) {
            const p = this.get();
            const a = Utils.randomRange(0, Math.PI * 2);
            p.reset(x, y, Math.cos(a) * 40, Math.sin(a) * 40, 0.5, 8, '#FFFFFF', 'circle', 0);
            p.glow = true; p.glowColor = '#FF8800';
        }
    }

    brickDebris(x, y, color = '#A88D70', n = 8) {
        // Exploding bricks
        this.burst(x, y, n, [color], 80, 250, 0.5, 1.2, 5, 8, 'brick', 400);
    }
    coinExplosion(x, y, n = 30) {
        this.burst(x, y, n, ['#FFD700','#FFA500','#FFE44D'], 80, 250, 0.8, 1.5, 3, 6, 'star', 200);
    }
    unitPop(x, y, color) {
        this.burst(x, y, 6, [color], 30, 80, 0.3, 0.6, 1, 3, 'circle', 150);
    }
    dustTrail(x, y, crowdCount) {
        const n = Math.min(3, Math.floor(crowdCount / 20) + 1);
        for (let i = 0; i < n; i++) {
            const p = this.get();
            p.reset(
                x + Utils.randomRange(-18, 18),
                y + Utils.randomRange(-4, 4),
                Utils.randomRange(-20, 20),
                Utils.randomRange(-15, -5),
                Utils.randomRange(0.3, 0.7),
                Utils.randomRange(2, 5),
                `rgba(${180 + Utils.randomRange(0, 50)},${160 + Utils.randomRange(0, 40)},${120 + Utils.randomRange(0, 30)},0.6)`,
                'circle', -10
            );
            p.shrink = true;
        }
    }

    // Neon ring explode (for power-up gates)
    neonRing(x, y, color) {
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const p = this.get();
            const sp = Utils.randomRange(80, 150);
            p.reset(x, y, Math.cos(angle) * sp, Math.sin(angle) * sp, 0.8, 5, color, 'circle', 0);
            p.glow = true; p.glowColor = color;
        }
    }

    // Lightning bolt effect
    lightningBurst(x, y) {
        this.burst(x, y, 20, ['#FFFFFF','#AADDFF','#FFFF00'], 80, 200, 0.3, 0.6, 2, 5, 'lightning', 0);
    }

    // Fire trail
    fireBurst(x, y, n = 15) {
        this.burst(x, y, n, ['#FF2200','#FF6600','#FF9900','#FFCC00'], 40, 120, 0.4, 0.9, 3, 7, 'circle', -50);
    }

    // Shield ripple
    shieldRipple(x, y) {
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const p = this.get();
            p.reset(x, y, Math.cos(angle) * 60, Math.sin(angle) * 60, 0.5, 4, '#00FFEE', 'circle', 0);
            p.glow = true; p.glowColor = '#00FFEE';
        }
    }

    feverTrail(x, y, count = 3) {
        const colors = ['#FF0055', '#FFCC00', '#00FFCC', '#9900FF', '#FF5500'];
        for (let i = 0; i < count; i++) {
            const p = this.get();
            const color = colors[Math.floor(Math.random() * colors.length)];
            p.reset(
                x + Utils.randomRange(-25, 25),
                y + Utils.randomRange(-10, 10),
                Utils.randomRange(-40, 40),
                Utils.randomRange(20, 80),
                Utils.randomRange(0.4, 0.8),
                Utils.randomRange(4, 9),
                color,
                'star',
                -30
            );
            p.glow = true;
            p.glowColor = color;
        }
    }
}

class ScreenFX {
    constructor() {
        this.shakeI = 0; this.shakeD = 0; this.shakeT = 0;
        this.ox = 0; this.oy = 0;
        this.flashC = ''; this.flashO = 0; this.flashD = 0; this.flashT = 0;
        // Vignette pulse for clash
        this.vignetteO = 0;
        this.vignetteColor = '#FF0000';
        this.vignettePulse = 0;
    }
    shake(i = 5, d = 0.3) { this.shakeI = i; this.shakeD = d; this.shakeT = d; }
    flash(c = 'rgba(255,0,0,0.3)', d = 0.2) { this.flashC = c; this.flashO = 1; this.flashD = d; this.flashT = d; }
    pulseVignette(color, duration) {
        this.vignetteO = 1;
        this.vignetteColor = color;
        this.vignetteD = duration;
        this.vignetteT = duration;
    }
    update(dt) {
        if (this.shakeT > 0) {
            this.shakeT -= dt;
            const p = this.shakeT / this.shakeD;
            this.ox = Utils.randomRange(-1, 1) * this.shakeI * p;
            this.oy = Utils.randomRange(-1, 1) * this.shakeI * p;
        } else { this.ox = 0; this.oy = 0; }
        if (this.flashT > 0) { this.flashT -= dt; this.flashO = Math.max(0, this.flashT / this.flashD); }
        if (this.vignetteT > 0) {
            this.vignetteT -= dt;
            this.vignetteO = Math.max(0, this.vignetteT / this.vignetteD);
        }
        this.vignettePulse += dt * 6;
    }
    apply(ctx) { ctx.translate(this.ox, this.oy); }
    drawFlash(ctx, w, h) {
        if (this.flashO > 0) {
            ctx.save(); ctx.globalAlpha = this.flashO * 0.4;
            ctx.fillStyle = this.flashC; ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }
        // Pulsing vignette during clash
        if (this.vignetteO > 0) {
            const a = this.vignetteO * (0.4 + Math.sin(this.vignettePulse) * 0.2);
            ctx.save();
            ctx.globalAlpha = a;
            const g = ctx.createRadialGradient(w/2, h/2, h*0.25, w/2, h/2, h*0.75);
            g.addColorStop(0, 'transparent');
            g.addColorStop(1, this.vignetteColor);
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }
    }
}

// ----------------------------------------------------
// Floating Text (Game Juice)
// ----------------------------------------------------
class FloatingText {
    constructor() { this.active = false; }
    reset(text, x, y, color, size, duration = 1.0) {
        this.active = true;
        this.text = text;
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.life = duration;
        this.maxLife = duration;
        this.vy = -100;
        this.scale = 0.2;
    }
    update(dt) {
        if (!this.active) return;
        this.life -= dt;
        this.y += this.vy * dt;
        this.vy *= 0.9;
        
        // Pop scale effect
        if (this.maxLife - this.life < 0.2) {
            this.scale = Utils.lerp(this.scale, 1.2, 0.3);
        } else {
            this.scale = Utils.lerp(this.scale, 1.0, 0.1);
        }
        
        if (this.life <= 0) this.active = false;
    }
    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        
        ctx.font = `900 ${this.size}px Outfit, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Glow / Outline
        ctx.strokeStyle = 'white';
        ctx.lineWidth = this.size * 0.2;
        ctx.lineJoin = 'round';
        ctx.strokeText(this.text, 0, 0);
        
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, 0, 0);
        
        ctx.restore();
    }
}

class FloatingTextManager {
    constructor(n = 20) { this.pool = Array.from({length: n}, () => new FloatingText()); }
    get() { return this.pool.find(p => !p.active) || this.pool[0]; }
    update(dt) { this.pool.forEach(p => p.active && p.update(dt)); }
    draw(ctx) { this.pool.forEach(p => p.active && p.draw(ctx)); }
    
    spawn(text, x, y, color, size = 40) {
        const t = this.get();
        t.reset(text, x + Utils.randomRange(-20, 20), y + Utils.randomRange(-20, 20), color, size);
    }
}
