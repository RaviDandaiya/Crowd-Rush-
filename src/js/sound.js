// ============================================================
// sound.js — Web Audio API synthesized SFX (no external files)
// ============================================================

class SoundManager {
    constructor() {
        this.enabled = true;
        this._ctx = null;
    }

    _getCtx() {
        if (!this._ctx) {
            try {
                this._ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch(e) { return null; }
        }
        if (this._ctx.state === 'suspended') this._ctx.resume();
        return this._ctx;
    }

    _play(fn) {
        if (!this.enabled) return;
        const ctx = this._getCtx();
        if (!ctx) return;
        try { fn(ctx); } catch(e) {}
    }

    // Positive gate hit — ascending chime
    gatePositive() {
        this._play(ctx => {
            const t = ctx.currentTime;
            const freqs = [440, 554, 659, 880];
            freqs.forEach((f, i) => {
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.connect(g); g.connect(ctx.destination);
                o.frequency.value = f;
                o.type = 'sine';
                g.gain.setValueAtTime(0.18, t + i * 0.07);
                g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.25);
                o.start(t + i * 0.07);
                o.stop(t + i * 0.07 + 0.3);
            });
        });
    }

    // Negative gate hit — descending buzz
    gateNegative() {
        this._play(ctx => {
            const t = ctx.currentTime;
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.type = 'sawtooth';
            o.frequency.setValueAtTime(220, t);
            o.frequency.exponentialRampToValueAtTime(55, t + 0.35);
            g.gain.setValueAtTime(0.3, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
            o.start(t); o.stop(t + 0.45);
        });
    }

    // Combo multiplier — sparkly bell
    combo(level) {
        this._play(ctx => {
            const t = ctx.currentTime;
            const base = 440 * Math.pow(1.2, level);
            [base, base * 1.5, base * 2].forEach((f, i) => {
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.connect(g); g.connect(ctx.destination);
                o.type = 'triangle';
                o.frequency.value = f;
                g.gain.setValueAtTime(0.2, t + i * 0.06);
                g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.4);
                o.start(t + i * 0.06);
                o.stop(t + i * 0.06 + 0.45);
            });
        });
    }

    // Shield activated — swoosh + hum
    shield() {
        this._play(ctx => {
            const t = ctx.currentTime;
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.type = 'sine';
            o.frequency.setValueAtTime(200, t);
            o.frequency.exponentialRampToValueAtTime(800, t + 0.3);
            g.gain.setValueAtTime(0.25, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
            o.start(t); o.stop(t + 0.55);
        });
    }

    // Explode gate — bang + debris
    explode() {
        this._play(ctx => {
            const t = ctx.currentTime;
            // Noise burst
            const bufLen = ctx.sampleRate * 0.3;
            const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i/bufLen, 2);
            const src = ctx.createBufferSource();
            src.buffer = buf;
            const g = ctx.createGain();
            src.connect(g); g.connect(ctx.destination);
            g.gain.setValueAtTime(0.6, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
            src.start(t); src.stop(t + 0.4);
        });
    }

    // Clash impact — deep thud
    clash() {
        this._play(ctx => {
            const t = ctx.currentTime;
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.type = 'sine';
            o.frequency.setValueAtTime(120, t);
            o.frequency.exponentialRampToValueAtTime(30, t + 0.3);
            g.gain.setValueAtTime(0.5, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
            o.start(t); o.stop(t + 0.45);
        });
    }

    // Castle hit — crack + rumble
    castleHit() {
        this._play(ctx => {
            const t = ctx.currentTime;
            const bufLen = ctx.sampleRate * 0.2;
            const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * 0.5 * Math.exp(-i / (bufLen * 0.3));
            const src = ctx.createBufferSource();
            src.buffer = buf;
            const flt = ctx.createBiquadFilter();
            flt.type = 'lowpass'; flt.frequency.value = 400;
            src.connect(flt); flt.connect(ctx.destination);
            src.start(t);
        });
    }

    // Victory fanfare — ascending 4-note melody
    victory() {
        this._play(ctx => {
            const t = ctx.currentTime;
            const melody = [392, 523, 659, 784]; // G4, C5, E5, G5
            melody.forEach((f, i) => {
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.connect(g); g.connect(ctx.destination);
                o.type = 'triangle';
                o.frequency.value = f;
                const st = t + i * 0.18;
                g.gain.setValueAtTime(0.3, st);
                g.gain.setValueAtTime(0.3, st + 0.12);
                g.gain.exponentialRampToValueAtTime(0.001, st + 0.5 + i * 0.1);
                o.start(st); o.stop(st + 0.6 + i * 0.1);
            });
        });
    }

    // Game over — sad tone
    gameOver() {
        this._play(ctx => {
            const t = ctx.currentTime;
            const freqs = [440, 349, 294, 220];
            freqs.forEach((f, i) => {
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.connect(g); g.connect(ctx.destination);
                o.type = 'sine';
                o.frequency.value = f;
                const st = t + i * 0.22;
                g.gain.setValueAtTime(0.25, st);
                g.gain.exponentialRampToValueAtTime(0.001, st + 0.4);
                o.start(st); o.stop(st + 0.45);
            });
        });
    }

    // Boss roar
    bossRoar() {
        this._play(ctx => {
            const t = ctx.currentTime;
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            const dist = ctx.createWaveShaper();
            const curve = new Float32Array(256);
            for (let i = 0; i < 256; i++) {
                const x = (i * 2) / 256 - 1;
                curve[i] = (Math.PI + 200) * x / (Math.PI + 200 * Math.abs(x));
            }
            dist.curve = curve;
            o.connect(dist); dist.connect(g); g.connect(ctx.destination);
            o.type = 'sawtooth';
            o.frequency.setValueAtTime(80, t);
            o.frequency.exponentialRampToValueAtTime(40, t + 0.8);
            g.gain.setValueAtTime(0.4, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
            o.start(t); o.stop(t + 1.1);
        });
    }

    // Phase transition — dramatic sting
    phaseTransition() {
        this._play(ctx => {
            const t = ctx.currentTime;
            const freqs = [220, 330, 440];
            freqs.forEach((f, i) => {
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.connect(g); g.connect(ctx.destination);
                o.type = 'square';
                o.frequency.value = f;
                const st = t + i * 0.1;
                g.gain.setValueAtTime(0.15, st);
                g.gain.exponentialRampToValueAtTime(0.001, st + 0.5);
                o.start(st); o.stop(st + 0.55);
            });
        });
    }

    // Number pop sound — small tick
    numberPop() {
        this._play(ctx => {
            const t = ctx.currentTime;
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.type = 'sine';
            o.frequency.setValueAtTime(880, t);
            o.frequency.exponentialRampToValueAtTime(440, t + 0.08);
            g.gain.setValueAtTime(0.12, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
            o.start(t); o.stop(t + 0.12);
        });
    }

    // Fever / Rush mode activation — epic energetic arpeggio
    feverRush() {
        this._play(ctx => {
            const t = ctx.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C E G C E G
            notes.forEach((f, i) => {
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.connect(g); g.connect(ctx.destination);
                o.type = 'sawtooth';
                o.frequency.value = f;
                const st = t + i * 0.06;
                g.gain.setValueAtTime(0.25, st);
                g.gain.exponentialRampToValueAtTime(0.001, st + 0.4);
                o.start(st); o.stop(st + 0.45);
            });
        });
    }

    // Power-up pickup chime
    powerup() {
        this._play(ctx => {
            const t = ctx.currentTime;
            const freqs = [587.33, 880.00, 1174.66]; // D5, A5, D6
            freqs.forEach((f, i) => {
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.connect(g); g.connect(ctx.destination);
                o.type = 'triangle';
                o.frequency.value = f;
                const st = t + i * 0.08;
                g.gain.setValueAtTime(0.3, st);
                g.gain.exponentialRampToValueAtTime(0.001, st + 0.35);
                o.start(st); o.stop(st + 0.4);
            });
        });
    }
}
