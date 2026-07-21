// ============================================================
// gate.js — 3D multiplier gates with WebGL mesh and 2D text overlay
// ============================================================

class Gate {
    constructor(cfg, side, yPos, scene) {
        this.type = cfg.type;
        this.value = cfg.value;
        this.label = cfg.label;
        this.side = side;
        this.y = yPos;
        this.moving = cfg.moving || false;
        this.special = (this.type === 'golden' || this.type === 'shield' || this.type === 'explode' || this.type === 'giant' || this.type === 'archer' || this.type === 'jackpot');
        this.isPositive = this.special ||
                          (this.type === 'multiply' && this.value > 1) ||
                          (this.type === 'add' && this.value > 0);
        this.glow = 0;
        this.triggered = false;
        this.pulse = Utils.randomRange(0, Math.PI * 2);
        
        // --- 3D Mesh ---
        // Colors
        let cHex = 0x00FF66;
        if (this.type === 'golden') cHex = 0xFFD700;
        else if (this.type === 'shield') cHex = 0x00AAFF;
        else if (this.type === 'explode') cHex = 0xFF6600;
        else if (this.type === 'giant') cHex = 0xCC22FF;
        else if (this.type === 'archer') cHex = 0x00BB55;
        else if (this.type === 'jackpot') cHex = 0xFF00AA;
        else if (!this.isPositive) cHex = 0xFF3344;
        
        // Create thick rectangular block
        const geom = new THREE.BoxGeometry(32, 12, 4);
        const mat = new THREE.MeshStandardMaterial({ 
            color: cHex, 
            roughness: 0.3,
            metalness: 0.2,
            transparent: true,
            opacity: 0.85
        });
        
        this.mesh = new THREE.Mesh(geom, mat);
        
        // Position: worldY maps to negative Z. Left/Right maps to X.
        const zPos = -this.y * 0.15;
        this.baseX = side === 'left' ? -17 : 17;
        this.mesh.position.set(this.baseX, 6, zPos);
        
        scene.add(this.mesh);
        
        // For text projection
        this.colorStr = '#' + cHex.toString(16).padStart(6, '0');
    }
    
    trigger() { 
        this.triggered = true; 
        this.glow = 1; 
        this.mesh.material.opacity = 0; // hide mesh when triggered
    }
    
    update(dt) {
        this.pulse += dt * 3;
        if (this.moving && !this.triggered) {
            this.mesh.position.x = this.baseX + Math.sin(this.pulse * 1.2) * 8;
        }
        if (this.triggered) {
            this.glow *= 0.96;
        } else {
            // Pulse opacity
            this.mesh.material.opacity = 0.5 + Math.sin(this.pulse) * 0.15;
        }
    }
}

class GateManager {
    constructor(game) {
        this.game = game;
        this.pairs = [];
        // Temporary vector for 3D to 2D projection
        this.vec = new THREE.Vector3();
    }

    init(level) {
        // Cleanup old meshes
        for (const pair of this.pairs) {
            if (pair.left.mesh) this.game.scene.remove(pair.left.mesh);
            if (pair.right.mesh) this.game.scene.remove(pair.right.mesh);
        }
        this.pairs = [];
        
        for (const g of level.gates) {
            const left  = this._buildGateCfg(g.left);
            const right = this._buildGateCfg(g.right);
            this.pairs.push({
                y: g.y,
                left:  new Gate(left, 'left', g.y, this.game.scene),
                right: new Gate(right, 'right', g.y, this.game.scene),
                passed: false,
            });
        }
    }

    _buildGateCfg(cfg) {
        if (!cfg) return { type: 'add', value: 0, label: '+0' };
        if (cfg.type === 'golden')  return { type: 'golden',  value: 2,   label: '×2 ALL', special: true };
        if (cfg.type === 'shield')  return { type: 'shield',  value: 30,  label: '🛡️ SHIELD', special: true };
        if (cfg.type === 'explode') return { type: 'explode', value: 200, label: '💥 EXPLODE', special: true };
        if (cfg.type === 'giant')   return { type: 'giant',   value: cfg.value || 3,  label: `👹 +${cfg.value || 3}`, special: true };
        if (cfg.type === 'archer')  return { type: 'archer',  value: cfg.value || 10, label: `🏹 +${cfg.value || 10}`, special: true };
        return cfg;
    }

    update(dt, crowdWorldY) {
        for (const pair of this.pairs) {
            pair.left.update(dt);
            pair.right.update(dt);

            if (!pair.passed && crowdWorldY >= pair.y - 5 && crowdWorldY <= pair.y + 40) {
                pair.passed = true;
                const crowdLaneX = this.game.crowd.laneX;
                let chosen = crowdLaneX <= 0 ? pair.left : pair.right;
                let other = chosen === pair.left ? pair.right : pair.left;

                chosen.trigger();
                other.mesh.material.opacity = 0.1; // dim the other

                // Project hit position to 2D screen for particles
                this.vec.setFromMatrixPosition(chosen.mesh.matrixWorld);
                this.vec.project(this.game.camera);
                const screenX = (this.vec.x * 0.5 + 0.5) * GC.W;
                const screenY = -(this.vec.y * 0.5 - 0.5) * GC.H;

                this._applyGate(chosen, screenX, screenY);
            }
        }
    }

    _applyGate(gate, sx, sy) {
        const crowd  = this.game.crowd;
        const combo  = this.game.combo;
        const sound  = this.game.sound;
        const fx     = this.game.screenFx;
        const parts  = this.game.particles;

        if (gate.type === 'golden') {
            const mult = combo ? combo.onPositive() : 1;
            const finalVal = Math.round(2 * mult);
            const before = crowd.count;
            crowd.applyGate('multiply', finalVal);
            const gained = crowd.count - before;
            fx.flash('rgba(255,215,0,0.6)', 0.4);
            fx.shake(6, 0.3);
            parts.confetti(sx, sy, 60);
            parts.coinExplosion(sx, sy, 40);
            this.game.floatingText.spawn(`✨ ×${finalVal} ALL! +${gained}`, sx, sy - 30, '#FFD700');
            if (sound) sound.gatePositive();

        } else if (gate.type === 'shield') {
            crowd.activateShield(30);
            fx.flash('rgba(0,200,255,0.5)', 0.4);
            parts.burst(sx, sy, 30, ['#00CCFF','#00FFEE','#FFFFFF'], 80, 200, 0.6, 1.2, 3, 6, 'circle', 100);
            parts.burst(sx, sy, 30, ['#00CCFF','#00FFEE','#FFFFFF'], 80, 200, 0.6, 1.2, 3, 6, 'circle', 100);
            if (combo) combo.onPositive();
            this.game.floatingText.spawn('🛡️ SHIELDED!', sx, sy - 30, '#00CCFF');
            if (sound) sound.shield();

        } else if (gate.type === 'explode') {
            const mult = combo ? combo.onPositive() : 1;
            const cleared = this.game.enemies.explodeNearby(crowd.worldY, 600 * mult);
            fx.flash('rgba(255,100,0,0.6)', 0.5);
            fx.shake(10, 0.5);
            parts.burst(sx, sy, 50, ['#FF4400','#FF8800','#FFCC00'], 120, 350, 0.6, 1.5, 3, 8, 'circle', 200);
            this.game.floatingText.spawn(`💥 CLEARED ${cleared}!`, sx, sy - 30, '#FF4400');
            if (sound) sound.explode();

        } else if (gate.type === 'jackpot') {
            const mult = combo ? combo.onPositive() : 1;
            const jackpotAmount = Math.round(50 * mult);
            crowd.addUnits(jackpotAmount);
            if (this.game.addFever) this.game.addFever(30);
            fx.flash('rgba(255,0,170,0.6)', 0.5);
            fx.shake(8, 0.4);
            parts.confetti(sx, sy, 70);
            parts.coinExplosion(sx, sy, 50);
            this.game.floatingText.spawn(`🎰 JACKPOT! +${jackpotAmount}`, sx, sy - 30, '#FF00AA');
            if (sound) sound.powerup();

        } else if (gate.type === 'giant' || gate.type === 'archer') {
            const mult = combo ? combo.onPositive() : 1;
            const num = Math.round(gate.value * mult);
            crowd.addUnits(num, gate.type);
            if (this.game.addFever) this.game.addFever(15);
            const color = gate.type === 'giant' ? '#FF22FF' : '#55FF55';
            fx.flash(`rgba(${gate.type==='giant'?'255,34,255':'85,255,85'},0.4)`, 0.3);
            parts.burst(sx, sy, 30, [color, '#FFFFFF'], 80, 200, 0.6, 1.2, 3, 6, 'circle', 100);
            this.game.floatingText.spawn(`+${num} ${gate.type.toUpperCase()}S!`, sx, sy - 30, color);
            if (sound) sound.gatePositive();

        } else if (gate.isPositive) {
            const mult = combo ? combo.onPositive() : 1;
            const before = crowd.count;
            crowd.applyGate(gate.type, Math.round(gate.value * mult));
            const gained = crowd.count - before;
            if (this.game.addFever) this.game.addFever(12);
            parts.confetti(sx, sy, 35);
            fx.flash('rgba(0,255,100,0.4)', 0.3);
            fx.shake(2, 0.2); // Add subtle screen shake on normal positive gates
            if (mult > 1 && combo) {
                this.game.floatingText.spawn(`+${gained} ×${mult}COMBO!`, sx, sy - 30, '#FFD700');
            } else {
                this.game.floatingText.spawn(`+${gained}`, sx, sy - 30, '#00FF88');
            }
            if (sound) sound.gatePositive();

        } else {
            const before = crowd.count;
            crowd.applyGate(gate.type, gate.value);
            const lost = before - crowd.count;
            parts.burst(sx, sy, 25, ['#FF0000','#FF3333','#FF6666','#CC0000'], 60, 200, 0.5, 1, 2, 5, 'circle', 200);
            fx.flash('rgba(255,0,0,0.4)', 0.3);
            fx.shake(6, 0.3);
            if (combo) {
                combo.onNegative();
            }
            this.game.floatingText.spawn(`-${lost}`, sx, sy - 30, '#FF4444');
            if (sound) sound.gateNegative();
        }
    }

    // Called by game.render() during the 2D UI pass to draw sharp text labels
    draw(ctx, crowdWorldY) {
        for (const pair of this.pairs) {
            // Cull distant or passed gates for text rendering
            if (pair.passed) continue;
            const dist = pair.y - crowdWorldY;
            if (dist < -50 || dist > 800) continue; // View distance

            this._drawGateText(ctx, pair.left);
            this._drawGateText(ctx, pair.right);
        }
    }

    _drawGateText(ctx, gate) {
        if (!gate.mesh || gate.triggered) return;
        
        // Project 3D center to 2D screen
        this.vec.setFromMatrixPosition(gate.mesh.matrixWorld);
        this.vec.project(this.game.camera);
        
        // Only draw if in front of camera
        if (this.vec.z > 1) return;
        
        const sx = (this.vec.x * 0.5 + 0.5) * GC.W;
        const sy = -(this.vec.y * 0.5 - 0.5) * GC.H;
        
        // Scale based on distance (w logic from Z depth)
        const depth = Math.abs(this.game.camera.position.z - gate.mesh.position.z);
        const scale = Utils.clamp(150 / depth, 0.3, 1.2);
        
        ctx.save();
        ctx.translate(sx, sy);
        ctx.scale(scale, scale);
        
        ctx.font = `900 24px "Outfit", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // White text with glowing colored outline
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = gate.colorStr;
        ctx.shadowBlur = 12;
        
        if (gate.special) {
            ctx.font = `20px sans-serif`;
            ctx.fillText(
                gate.type === 'golden'  ? '✨' :
                gate.type === 'shield'  ? '🛡️' :
                gate.type === 'explode' ? '💥' :
                gate.type === 'giant'   ? '👹' : '🏹',
                0, -15
            );
            ctx.font = `bold 16px "Outfit", sans-serif`;
            ctx.fillText(
                gate.type === 'golden'  ? '×2 ALL' :
                gate.type === 'shield'  ? 'SHIELD' :
                gate.type === 'explode' ? 'CLEAR!' :
                gate.type === 'giant'   ? `+${gate.value} GIANT` : `+${gate.value} ARCHER`,
                0, 15
            );
        } else {
            ctx.fillText(gate.label, 0, 0);
        }
        
        ctx.restore();
    }
}
