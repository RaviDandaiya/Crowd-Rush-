// ============================================================
// enemy.js — 3D Enemy mobs with unique POWERS and animations
// ============================================================

const ENEMY_TYPES = {
    normal:     { color: 0xFF4444, headColor: '#FF6666', outlineColor: '#AA0000', emoji: '⚔️', name: 'Warrior' },
    shielder:   { color: 0x4444FF, headColor: '#6666FF', outlineColor: '#0000AA', emoji: '🛡️', name: 'Shielder' },
    berserker:  { color: 0xFF8800, headColor: '#FFAA00', outlineColor: '#AA4400', emoji: '💢', name: 'Berserker' },
    sniper:     { color: 0x22AA22, headColor: '#44CC44', outlineColor: '#005500', emoji: '🎯', name: 'Sniper' },
    bomber:     { color: 0xAA22AA, headColor: '#CC44CC', outlineColor: '#550055', emoji: '💣', name: 'Bomber' },
    split_boss: { color: 0x8800CC, headColor: '#AA44FF', outlineColor: '#440066', emoji: '👹', name: 'Split Boss' },
};

class EnemyMob {
    constructor(y, count, type = 'normal', scene) {
        this.worldY = y;
        this.count = count;
        this.maxCount = count;
        this.type = type;
        this.units = [];
        this.state = 'waiting';
        this.hp = count;
        this.scaled = false;
        
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        // Initial setup
        this.group.position.z = -this.worldY * 0.15;
        this.group.position.y = 0;
        this.group.position.x = 0;

        // Power state
        this.power = null;
        this.powerTimer = 0;
        this.powerCooldown = Utils.randomRange(0.5, 2); // FIX: faster first power use
        this.powerActive = false;
        this.shieldActive = false;
        this.rageActive = false;
        this.rageMultiplier = 1;
        this.projectiles = [];
        this.animTime = 0;

        // Split boss specific
        this.splitPhase = 'intro';
        this.splitTimer = 0;
        this.splitWindow = 3.0;
        this.laneHistory = [];
        this.splitSucceeded = false;
        
        // Setup shared materials and geometries
        this.geomBodyNormal = new THREE.CapsuleGeometry(1.2, 2.0, 4, 8);
        this.geomBodyBoss = new THREE.CapsuleGeometry(3.5, 6.0, 6, 16);
        this.geomLimb = new THREE.CapsuleGeometry(0.8, 2.5, 4, 8); // for boss arms/legs
        
        const typeInfo = ENEMY_TYPES[type] || ENEMY_TYPES.normal;
        this.material = new THREE.MeshStandardMaterial({
            color: type === 'split_boss' ? 0x8800CC : typeInfo.color, // Purple boss
            roughness: 0.8,
            metalness: 0.1
        });

        const vc = Math.min(count, type === 'split_boss' ? 1 : 80);
        for (let i = 0; i < vc; i++) {
            this.units.push(this._makeUnit(type === 'split_boss'));
        }
    }
    
    _makeUnit(isBoss) {
        const geomBody = isBoss ? this.geomBodyBoss : this.geomBodyNormal;
        
        const unitGroup = new THREE.Group();
        
        const body = new THREE.Mesh(geomBody, this.material);
        body.position.y = isBoss ? 6.5 : 2.2;
        unitGroup.add(body);
        
        if (isBoss) {
            // Boss Arms
            const armL = new THREE.Mesh(this.geomLimb, this.material);
            armL.position.set(-4.5, 6, 0);
            armL.rotation.z = -Math.PI / 4;
            unitGroup.add(armL);
            
            const armR = new THREE.Mesh(this.geomLimb, this.material);
            armR.position.set(4.5, 6, 0);
            armR.rotation.z = Math.PI / 4;
            unitGroup.add(armR);
            
            // Boss Legs
            const legL = new THREE.Mesh(this.geomLimb, this.material);
            legL.position.set(-2, 2, 0);
            legL.rotation.z = -Math.PI / 8;
            unitGroup.add(legL);
            
            const legR = new THREE.Mesh(this.geomLimb, this.material);
            legR.position.set(2, 2, 0);
            legR.rotation.z = Math.PI / 8;
            unitGroup.add(legR);
        }
        
        // Eyes (Large white base, small black pupil)
        const eyeWGeom = new THREE.SphereGeometry(isBoss ? 1.0 : 0.35, 8, 8);
        const eyeBGeom = new THREE.SphereGeometry(isBoss ? 0.4 : 0.12, 8, 8);
        const matW = new THREE.MeshBasicMaterial({color: 0xFFFFFF});
        const matB = new THREE.MeshBasicMaterial({color: 0x000000});
        
        const yOffset = isBoss ? 2.5 : 0.8;
        const zOffset = isBoss ? 3.0 : 1.0;
        const xOffset = isBoss ? 1.2 : 0.4;
        
        const eyeL = new THREE.Mesh(eyeWGeom, matW);
        eyeL.position.set(-xOffset, yOffset, zOffset);
        body.add(eyeL);
        const pupilL = new THREE.Mesh(eyeBGeom, matB);
        pupilL.position.set(0, 0, isBoss ? 0.9 : 0.3);
        eyeL.add(pupilL);
        
        const eyeR = new THREE.Mesh(eyeWGeom, matW);
        eyeR.position.set(xOffset, yOffset, zOffset);
        body.add(eyeR);
        const pupilR = new THREE.Mesh(eyeBGeom, matB);
        pupilR.position.set(0, 0, isBoss ? 0.9 : 0.3);
        eyeR.add(pupilR);
        
        const maxRadius = isBoss ? 0 : Math.min(18, 2.5 + Math.sqrt(this.count) * 0.3);
        const radius = isBoss ? 0 : Utils.randomRange(0.5, maxRadius);
        const angle = Utils.randomRange(0, Math.PI * 2);
        
        unitGroup.position.x = Math.cos(angle) * radius;
        unitGroup.position.z = Math.sin(angle) * radius;
        unitGroup.position.y = 0;
        
        this.group.add(unitGroup);
        
        return {
            mesh: unitGroup,
            ox: unitGroup.position.x,
            oz: unitGroup.position.z,
            phase: Utils.randomRange(0, Math.PI * 2),
            speed: Utils.randomRange(6, 10),
            targetScale: 1,
            scale: 1,
            alive: true,
            isBoss: isBoss
        };
    }

    removeOne() {
        if (this.type === 'shielder' && this.shieldActive) return false;
        return this.removeAmount(1) > 0;
    }

    removeAmount(amount) {
        if (amount <= 0 || this.count <= 0) return 0;
        
        const prevCount = this.count;
        this.count = Math.max(0, this.count - amount);
        const removed = prevCount - this.count;
        
        // Calculate how many visual units should remain alive
        // Ensure at least 1 remains alive as long as this.count > 0
        const desiredAlive = this.count > 0 ? Math.max(1, Math.ceil((this.count / this.maxCount) * this.units.length)) : 0;
        const currentAlive = this.units.filter(u => u.alive).length;
        
        console.log(`[enemy removeAmount] count: ${this.count}, maxCount: ${this.maxCount}, units: ${this.units.length}, desiredAlive: ${desiredAlive}, currentAlive: ${currentAlive}, amount: ${amount}`);
        
        let toKill = currentAlive - desiredAlive;
        for (let i = this.units.length - 1; i >= 0 && toKill > 0; i--) {
            const u = this.units[i];
            if (u.alive) {
                u.alive = false;
                u.targetScale = 0;
                // Death burst: fly backward (away from camera, enemy side)
                u.deathVx = Utils.randomRange(-10, 10);
                u.deathVz = Utils.randomRange(-25, -8);
                u.deathVy = Utils.randomRange(8, 18);
                u.deathSpin = Utils.randomRange(-8, 8);
                toKill--;
            }
        }
        
        return removed;
    }

    update(dt, game) {
        this.animTime += dt;

        for (let i = this.units.length - 1; i >= 0; i--) {
            const u = this.units[i];
            u.phase += u.speed * dt;
            
            if (u.alive) {
                u.mesh.visible = true; // Ensure they are visible when alive!
                
                let spreadScale = Math.min(1 + Math.sqrt(Math.min(this.count, 2000)) * 0.05, 1.8);
                
                let tx = u.ox * spreadScale;
                let tz = u.oz * spreadScale;

                let sxFactor = 1.0;
                let syFactor = 1.0;
                let szFactor = 1.0;
                const clashing = game && game.state === 'CLASH' && this.state === 'clashing';

                if (clashing) {
                    if (u.ringAngle === undefined) {
                        // Spacing based on index to form a clean line-by-line chain
                        u.ringAngle = i * 0.15;
                    }
                    u.ringAngle -= dt * 6.5; // rotate in opposite direction to meet head-on!
                    
                    const t = u.ringAngle;
                    const orbitW = 9.0;
                    const orbitH = 4.5;
                    
                    // Circular loop on enemy's side: Z starts at 1.875 (clash midpoint) and goes forward
                    tx = Math.sin(t) * orbitW;
                    tz = -(1 - Math.cos(t)) * orbitH + 1.875;
                    
                    // Flat on the ground (no up-down animation when clashing)
                    const isBoss = this.type === 'split_boss';
                    u.mesh.position.y = isBoss ? 6.5 : 2.2;
                    
                    const attacking = tz > 2.5; // deep in clash zone
                    u.targetScale = attacking ? 1.25 : 1.0;
                    
                    if (attacking) {
                        // Stretch: taller body, thinner radius
                        syFactor = 1.25;
                        sxFactor = 0.85;
                        szFactor = 0.85;
                        
                        // Lean forward in direction of attack (+Z)
                        u.mesh.rotation.x = Utils.lerp(u.mesh.rotation.x || 0, -0.35, 0.2);
                    } else {
                        // Squash when returning/landing
                        syFactor = 0.85;
                        sxFactor = 1.15;
                        szFactor = 1.15;
                        u.mesh.rotation.x = Utils.lerp(u.mesh.rotation.x || 0, 0, 0.2);
                    }
                    
                    // Face moving direction (heading yaw rotation)
                    const vx = -Math.cos(t) * orbitW;
                    const vz = Math.sin(t) * orbitH;
                    const targetRotY = Math.atan2(vx, vz);
                    u.mesh.rotation.y = Utils.lerp(u.mesh.rotation.y || 0, targetRotY, 0.18);
                } else {
                    u.mesh.position.y = Math.abs(Math.sin(u.phase)) * 2;
                    if (u.ringAngle !== undefined) u.ringAngle = undefined;
                    u.targetScale = 1.0;
                    u.mesh.rotation.x = Utils.lerp(u.mesh.rotation.x || 0, 0, 0.1);
                    u.mesh.rotation.y = Utils.lerp(u.mesh.rotation.y || 0, 0, 0.08);
                }

                u.mesh.position.x = Utils.lerp(u.mesh.position.x, tx, 0.18);
                u.mesh.position.z = Utils.lerp(u.mesh.position.z, tz, 0.18);
                
                u.scale = Utils.lerp(u.scale, u.targetScale, 0.18);
                u.mesh.scale.set(u.scale * sxFactor, u.scale * syFactor, u.scale * szFactor);
            } else {
                // Death burst: fly outward from center
                if (u.deathVx !== undefined) {
                    u.mesh.position.x += u.deathVx * dt;
                    u.mesh.position.z += u.deathVz * dt;
                    u.mesh.position.y += u.deathVy * dt;
                    u.deathVy -= 30 * dt; // gravity
                    u.deathVx *= 0.85;
                    u.deathVz *= 0.85;
                    u.mesh.rotation.z += u.deathSpin * dt;
                }
                
                u.scale = Utils.lerp(u.scale, u.targetScale, 0.18);
                u.mesh.scale.set(u.scale, u.scale, u.scale);
            }
            
            if (!u.alive && u.scale < 0.05) {
                u.mesh.visible = false;
            }
        }

        // Projectiles (2D visual only for now, mapping logic keeps it simple)
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const pr = this.projectiles[i];
            pr.x += pr.vx * dt;
            pr.y += pr.vy * dt;
            pr.life -= dt;
            if (pr.life <= 0) { this.projectiles.splice(i, 1); continue; }

            if (game && pr.y > GC.CROWD_SCREEN_Y - 30 && Math.abs(pr.x - (GC.W/2 + game.crowd.laneX * GC.LANE_W * 0.44)) < 50) {
                const dmg = pr.damage || 1;
                game.crowd.clashRemoveAmount(dmg);
                if (game.particles) game.particles.fireBurst(pr.x, pr.y, 10);
                if (game.screenFx) game.screenFx.flash('rgba(255,80,0,0.4)', 0.25);
                this.projectiles.splice(i, 1);
            }
        }

        if (this.state === 'clashing' && game) {
            this.powerCooldown -= dt;
            if (this.powerCooldown <= 0) {
                this._activatePower(game);
                this.powerCooldown = Utils.randomRange(4, 8);
            }

            if (this.type === 'shielder') {
                this.powerTimer += dt;
                if (this.powerTimer > 2.0) {
                    this.shieldActive = !this.shieldActive;
                    this.powerTimer = 0;
                    if (game.particles) game.particles.shieldRipple(GC.W/2, GC.CROWD_SCREEN_Y - 100);
                }
            }
        }
    }

    _activatePower(game) {
        switch(this.type) {
            case 'sniper':
                for (let i = 0; i < 3; i++) {
                    const startY = GC.CROWD_SCREEN_Y - 150 - i * 10;
                    const targetX = GC.W/2 + game.crowd.laneX * GC.LANE_W * 0.44 + Utils.randomRange(-30, 30);
                    const dx = targetX - GC.W/2;
                    const dy = GC.CROWD_SCREEN_Y - startY;
                    const len = Math.sqrt(dx*dx + dy*dy);
                    this.projectiles.push({
                        x: GC.W/2 + Utils.randomRange(-20, 20),
                        y: startY,
                        vx: (dx/len) * 280,
                        vy: (dy/len) * 280,
                        life: 1.2,
                        color: '#44FF44',
                        damage: 2,
                        type: 'arrow'
                    });
                }
                if (game.screenFx) game.screenFx.flash('rgba(0,200,0,0.2)', 0.2);
                break;
            case 'bomber':
                this.projectiles.push({
                    x: GC.W/2 + Utils.randomRange(-40, 40),
                    y: GC.CROWD_SCREEN_Y - 180,
                    vx: Utils.randomRange(-30, 30),
                    vy: 120,
                    life: 1.0,
                    color: '#AA22AA',
                    damage: 8,
                    type: 'bomb',
                    exploded: false
                });
                break;
            case 'berserker':
                if (game.crowd && this.rageActive) {
                    const hits = Math.floor(game.crowd.count * 0.08);
                    game.crowd.clashRemoveAmount(hits);
                    if (game.particles) game.particles.fireBurst(GC.W/2, GC.CROWD_SCREEN_Y - 30, 20);
                    if (game.screenFx) {
                        game.screenFx.shake(12, 0.4);
                        game.screenFx.flash('rgba(255,60,0,0.5)', 0.35);
                    }
                }
                break;
        }
    }
}

class EnemyManager {
    constructor(game) {
        this.game = game;
        this.mobs = [];
        this.currentClash = null;
        this.clashAcc = 0;
        this.vec = new THREE.Vector3();
    }

    init(level) {
        for (const mob of this.mobs) {
            if (mob.group) this.game.scene.remove(mob.group);
        }
        this.mobs = [];
        this.currentClash = null;
        this.clashAcc = 0;
        
        for (const e of level.enemies) {
            let type = e.type || 'normal';
            if (!e.type) {
                const roll = Math.random();
                if (roll < 0.2)      type = 'shielder';
                else if (roll < 0.4) type = 'berserker';
                else if (roll < 0.55) type = 'sniper';
                else if (roll < 0.65) type = 'bomber';
                else                  type = 'normal';
            }
            this.mobs.push(new EnemyMob(e.y, e.count, type, this.game.scene));
        }
    }

    explodeNearby(crowdWorldY, range) {
        let cleared = 0;
        for (const mob of this.mobs) {
            if (mob.state === 'defeated') continue;
            const dist = Math.abs(mob.worldY - crowdWorldY);
            if (dist < range) {
                cleared += mob.count;
                mob.count = 0;
                this._defeatMob(mob, crowdWorldY);
                if (this.game.sound) this.game.sound.explode();
            }
        }
        return cleared;
    }

    update(dt, crowdWorldY) {
        for (let i = 0; i < this.mobs.length; i++) {
            const mob = this.mobs[i];
            mob.update(dt, this.game);

            if (mob.state === 'waiting') {
                if (crowdWorldY >= mob.worldY - 1000 && !mob.scaled) {
                    const minDesired = Math.floor(this.game.crowd.count * 0.45);
                    if (mob.count < minDesired) {
                        mob.count = minDesired;
                        mob.maxCount = minDesired;
                        mob.hp = minDesired;
                        const vc = Math.min(mob.count, mob.type === 'split_boss' ? 1 : 80);
                        while (mob.units.length < vc) {
                            mob.units.push(mob._makeUnit(mob.type === 'split_boss'));
                        }
                    }
                    mob.scaled = true;
                }

                if (crowdWorldY >= mob.worldY - 25) {
                    mob.state = 'clashing';
                    this.currentClash = i;
                    this.game.state = 'CLASH';
                    this.game.screenFx.shake(8, 0.5);
                    this.game.screenFx.pulseVignette('#FF0000', 999);
                    if (this.game.sound) this.game.sound.clash();
                    if (mob.type === 'split_boss') {
                        this.game.sound && this.game.sound.bossRoar();
                        mob.splitPhase = 'detecting';
                        mob.splitTimer = mob.splitWindow;
                        mob.laneHistory = [];
                    }
                }
            }

            if (mob.state === 'clashing') {
                if (mob.type === 'split_boss') {
                    this._updateBossClash(mob, dt, crowdWorldY);
                } else {
                    this._updateNormalClash(mob, dt, crowdWorldY);
                }
            }
        }
    }

    _updateNormalClash(mob, dt, crowdWorldY) {
        this.clashAcc += dt;
        const baseInterval = 1 / GC.CLASH_RATE;
        const interval = mob.rageActive ? baseInterval * 0.5 : baseInterval;

        while (this.clashAcc >= interval) {
            this.clashAcc -= interval;
            
            // FIX: each side removes based on their OWN count to keep fights balanced
            // Enemy removes units proportional to enemy count (attacker strength)
            const enemyTickRemove = Math.max(1, Math.ceil(mob.count / 18));
            // Crowd damage proportional to crowd count (defender strength)
            const crowdTickRemove = Math.max(1, Math.ceil(this.game.crowd.count / 18));
            
            const erAmount = mob.removeAmount(enemyTickRemove);
            const er = erAmount > 0;
            const shielded = this.game.crowd.shielded && this.game.crowd.shieldTime > 0;
            
            // 60% chance of surviving a clash without taking damage, greatly improving winnability!
            let dmg = 0;
            if (!shielded) {
                if (Math.random() < 0.4) {
                    dmg = this.game.crowd.clashRemoveAmount(crowdTickRemove);
                }
            }

            if (er || dmg > 0) {
                this.vec.setFromMatrixPosition(mob.group.matrixWorld);
                this.vec.project(this.game.camera);
                const screenY = -(this.vec.y * 0.5 - 0.5) * GC.H;
                
                if (er) this.game.particles.clashSparks(GC.W / 2 + Utils.randomRange(-30, 30), screenY, 5);
                if (dmg > 0) {
                    const activeSkin = CROWD_SKINS[this.game.crowd.skinKey];
                    let popColor = '#4A9EFF';
                    if (activeSkin) {
                        popColor = activeSkin.body === 'rainbow' ? `hsl(${Math.random() * 360}, 100%, 65%)` : activeSkin.body;
                    }
                    this.game.particles.unitPop(
                        GC.W / 2 + Utils.randomRange(-30, 30),
                        GC.CROWD_SCREEN_Y + Utils.randomRange(-10, 10), popColor);
                }
            }

            if (mob.count <= 0) {
                this._defeatMob(mob, crowdWorldY);
                break;
            }
            if (this.game.crowd.count <= 0) {
                this.game.screenFx.pulseVignette('transparent', 0);
                this.game.state = 'GAME_OVER';
                this.currentClash = null;
                this.clashAcc = 0;
                if (this.game.sound) this.game.sound.gameOver();
                break;
            }
        }
    }

    _defeatMob(mob, crowdWorldY) {
        mob.state = 'defeated';
        this.currentClash = null;
        this.clashAcc = 0;
        this.game.state = 'PLAYING';
        this.game.screenFx.pulseVignette('transparent', 0);
        
        // Immediately hide 3D group so it doesn't ghost on screen
        mob.group.visible = false;
        // Remove from scene entirely
        if (mob.group.parent) {
            this.game.scene.remove(mob.group);
        }
        
        this.vec.setFromMatrixPosition(mob.group.matrixWorld);
        this.vec.project(this.game.camera);
        const screenY = -(this.vec.y * 0.5 - 0.5) * GC.H;
        
        this.game.particles.confetti(GC.W / 2, screenY, 50);
        this.game.particles.coinExplosion(GC.W / 2, screenY, 25);
        this.game.screenFx.flash('rgba(0,255,100,0.4)', 0.5);
        this.game.screenFx.shake(10, 0.6);

        const typeInfo = ENEMY_TYPES[mob.type] || ENEMY_TYPES.normal;
        if (this.game.combo) this.game.combo.addNumberPop(GC.W/2, screenY - 50, `${typeInfo.emoji} DEFEATED!`, typeInfo.headColor);
    }

    _updateBossClash(mob, dt, crowdWorldY) {
        const laneX = this.game.crowd.laneX;
        if (mob.splitPhase === 'detecting') {
            mob.splitTimer -= dt;
            mob.laneHistory.push(laneX);
            const wentLeft  = mob.laneHistory.some(x => x < -0.3);
            const wentRight = mob.laneHistory.some(x => x >  0.3);
            if (wentLeft && wentRight) {
                mob.splitSucceeded = true;
                mob.splitPhase = 'success';
                mob.count = 0;
                for (const u of mob.units) u.targetScale = 0;
                
                this._defeatMob(mob, crowdWorldY);
                
                // Trigger boss-specific popups/sounds
                if (this.game.combo) this.game.combo.addNumberPop(GC.W/2, GC.CROWD_SCREEN_Y - 140, '⚡ BOSS SPLIT!', '#FFD700');
                if (this.game.sound) this.game.sound.victory();
            } else if (mob.splitTimer <= 0) {
                mob.splitPhase = 'punish';
                mob.splitTimer = 0.5;
            }
        } else if (mob.splitPhase === 'punish') {
            mob.splitTimer -= dt;
            if (mob.splitTimer <= 0) {
                const punish = Math.max(5, Math.floor(this.game.crowd.count * 0.35));
                this.game.crowd.clashRemoveAmount(punish);
                this.game.screenFx.shake(15, 0.7);
                this.game.screenFx.flash('rgba(255,0,0,0.6)', 0.5);
                if (this.game.combo) this.game.combo.addNumberPop(GC.W/2, GC.CROWD_SCREEN_Y - 60, `⚡ BOSS PUNISH! -${punish}`, '#FF4444');
                if (this.game.sound) this.game.sound.bossRoar();
                if (this.game.crowd.count <= 0) {
                    this.game.screenFx.pulseVignette('transparent', 0);
                    this.game.state = 'GAME_OVER';
                    this.currentClash = null;
                    if (this.game.sound) this.game.sound.gameOver();
                    return;
                }
                mob.splitPhase = 'detecting';
                mob.splitTimer = mob.splitWindow;
                mob.laneHistory = [];
            }
        }
    }

    draw(ctx, crowdWorldY) {
        for (const mob of this.mobs) {
            if (mob.state === 'defeated' && mob.units.every(u => u.scale < 0.05) && mob.projectiles.length === 0) continue;
            
            // Only draw UI for visible mobs
            this.vec.setFromMatrixPosition(mob.group.matrixWorld);
            this.vec.project(this.game.camera);
            if (this.vec.z > 1 || this.vec.z < -1) continue;
            
            const screenX = (this.vec.x * 0.5 + 0.5) * GC.W;
            const screenY = -(this.vec.y * 0.5 - 0.5) * GC.H;
            
            // Scale based on distance
            const depth = Math.abs(this.game.camera.position.z - mob.group.position.z);
            const scale = Utils.clamp(200 / depth, 0.2, 1.5);

            if (mob.type === 'split_boss') {
                this._drawBossUI(ctx, mob, screenX, screenY, scale);
            } else {
                this._drawNormalMobUI(ctx, mob, screenX, screenY, scale);
            }

            for (const pr of mob.projectiles) {
                ctx.save();
                if (pr.type === 'arrow') {
                    ctx.strokeStyle = '#44FF44';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#44FF44';
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.moveTo(pr.x - pr.vx * 0.05, pr.y - pr.vy * 0.05);
                    ctx.lineTo(pr.x, pr.y);
                    ctx.stroke();
                    ctx.fillStyle = '#FFFFFF';
                    ctx.beginPath(); ctx.arc(pr.x, pr.y, 3, 0, Math.PI*2); ctx.fill();
                } else if (pr.type === 'bomb') {
                    ctx.globalAlpha = 0.7 + Math.sin(Date.now() * 0.015) * 0.3;
                    ctx.fillStyle = '#AA22AA';
                    ctx.shadowColor = '#FF44FF';
                    ctx.shadowBlur = 12;
                    ctx.beginPath(); ctx.arc(pr.x, pr.y, 10, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('💣', pr.x, pr.y + 4);
                }
                ctx.restore();
            }
        }
    }

    _drawNormalMobUI(ctx, mob, screenX, screenY, scale) {
        if (scale < 0.25 || mob.count <= 0) return;
        
        const typeInfo = ENEMY_TYPES[mob.type] || ENEMY_TYPES.normal;
        
        ctx.save();
        const bw = 55 * scale;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.beginPath(); ctx.roundRect(screenX - bw/2, screenY - 50*scale, bw, 22*scale, 10*scale); ctx.fill();

        ctx.font = `${Math.max(8, 11*scale)}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(typeInfo.emoji, screenX - 14*scale, screenY - 39*scale);

        ctx.fillStyle = typeInfo.headColor;
        ctx.font = `bold ${Math.max(8, Math.floor(13*scale))}px "Outfit", sans-serif`;
        ctx.fillText(mob.count, screenX + 8*scale, screenY - 39*scale);
        
        if (mob.state === 'waiting') {
            const wa = 0.5 + Math.sin(Date.now() * 0.008) * 0.4;
            ctx.globalAlpha = wa;
            ctx.font = `bold ${Math.max(9, 13*scale)}px "Outfit", sans-serif`;
            ctx.shadowColor = typeInfo.headColor; ctx.shadowBlur = 10;
            ctx.fillText(`${typeInfo.emoji} ${typeInfo.name.toUpperCase()}!`, screenX, screenY - 70*scale);
        }
        ctx.restore();
    }

    _drawBossUI(ctx, mob, screenX, screenY, scale) {
        if (mob.state === 'defeated' || scale < 0.3) return;
        
        ctx.save();
        const bw = 70*scale, bh = 8*scale;
        const bx = screenX - bw/2, by = screenY - 90*scale;
        
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.beginPath(); ctx.roundRect(bx-2, by-2, bw+4, bh+4, 4); ctx.fill();
        ctx.fillStyle = '#440000'; ctx.fillRect(bx, by, bw, bh);
        
        const pct = mob.count / mob.maxCount;
        ctx.fillStyle = pct > 0.5 ? '#FF4444' : pct > 0.25 ? '#FF8800' : '#FF0000';
        ctx.shadowColor = '#FF0000'; ctx.shadowBlur = 6;
        ctx.fillRect(bx, by, bw*pct, bh);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#FFF';
        ctx.font = `bold ${Math.max(8, Math.floor(9*scale))}px "Outfit", sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('👹 BOSS', screenX, by + bh/2);
        
        if (mob.splitPhase === 'detecting' && scale > 0.4) {
            const timer_t = mob.splitTimer / mob.splitWindow;
            const alpha = 0.8 + Math.sin(Date.now()*0.01) * 0.2;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#FFD700';
            ctx.font = `bold ${Math.max(12, Math.floor(14*scale))}px "Outfit", sans-serif`;
            ctx.shadowColor = '#FF8800'; ctx.shadowBlur = 10;
            ctx.fillText('↔️ SPLIT LEFT & RIGHT!', screenX, screenY - 110*scale);
            
            const tw = 80*scale, tx = screenX - tw/2, ty = screenY - 125*scale;
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(tx, ty, tw, 6*scale);
            ctx.fillStyle = timer_t > 0.5 ? '#00FF44' : timer_t > 0.25 ? '#FFAA00' : '#FF4444';
            ctx.fillRect(tx, ty, tw*timer_t, 6*scale);
        }
        ctx.restore();
    }

    isClashing() { return this.currentClash !== null; }
}
