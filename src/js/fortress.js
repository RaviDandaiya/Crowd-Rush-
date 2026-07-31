// ============================================================
// fortress.js — 3D Cyberpunk Fortress
// ============================================================

class Fortress {
    constructor(game) {
        this.game = game;
        this.maxHP = 100; this.hp = 100;
        this.worldY = 0; this.state = 'waiting';
        this.attackTimer = 0; this.damageDealt = 0;
        this.shake = 0; this.coinsEarned = 0;
        
        this.group = new THREE.Group();
        this.game.scene.add(this.group);
        
        this.vec = new THREE.Vector3();
    }

    init(level) {
        if (this.princessMesh) {
            this.game.scene.remove(this.princessMesh);
            this.princessMesh.traverse(child => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                }
            });
            this.princessMesh = null;
        }
        // Deep copy the phases to avoid mutating the static LEVELS config across games
        this.phases = (level.fortress.phases || [{ hp: level.fortress.hp, label: 'Fortress' }]).map(p => ({ ...p }));
        this.phaseIndex = 0;
        this.currentPhase = this.phases[0];
        this.maxHP = this.currentPhase.hp;
        this.hp = this.maxHP;
        this.totalMaxHP = level.fortress.hp;
        this.worldY = level.laneLength;
        this.state = 'waiting';
        this.damageDealt = 0; this.shake = 0; this.coinsEarned = 0;
        this.scaled = false; // Reset scaled flag for every level load
        
        // Remove old meshes
        while(this.group.children.length > 0){ 
            this.group.remove(this.group.children[0]); 
        }
        
        this.group.scale.set(1, 1, 1);
        this.group.rotation.set(0, 0, 0);
        this.group.visible = true;
        this.group.position.set(0, 0, -this.worldY * 0.15);

        // Build Cyberpunk Fortress Mesh
        // Instead of a castle, the level end target is a giant purple boss
        // representing the "City Wall" or level boss as seen in the reference image.
        this.geomBody = new THREE.CapsuleGeometry(8, 14, 8, 16);
        this.geomLimb = new THREE.CapsuleGeometry(2, 6, 8, 8);
        this.matPurple = new THREE.MeshStandardMaterial({ 
            color: 0x8800CC, 
            roughness: 0.8,
            metalness: 0.1
        });
        
        const body = new THREE.Mesh(this.geomBody, this.matPurple);
        body.position.y = 15;
        this.group.add(body);
        
        // Arms
        const armL = new THREE.Mesh(this.geomLimb, this.matPurple);
        armL.position.set(-10, 14, 0);
        armL.rotation.z = -Math.PI / 4;
        this.group.add(armL);
        
        const armR = new THREE.Mesh(this.geomLimb, this.matPurple);
        armR.position.set(10, 14, 0);
        armR.rotation.z = Math.PI / 4;
        this.group.add(armR);
        
        // Legs
        const legL = new THREE.Mesh(this.geomLimb, this.matPurple);
        legL.position.set(-4, 5, 0);
        legL.rotation.z = -Math.PI / 8;
        this.group.add(legL);
        
        const legR = new THREE.Mesh(this.geomLimb, this.matPurple);
        legR.position.set(4, 5, 0);
        legR.rotation.z = Math.PI / 8;
        this.group.add(legR);
        
        // Eyes
        const eyeWGeom = new THREE.SphereGeometry(2.5, 16, 16);
        const eyeBGeom = new THREE.SphereGeometry(1.0, 16, 16);
        const matW = new THREE.MeshBasicMaterial({color: 0xFFFFFF});
        const matB = new THREE.MeshBasicMaterial({color: 0x000000});
        
        const eyeL = new THREE.Mesh(eyeWGeom, matW);
        eyeL.position.set(-3, 19, 7);
        this.group.add(eyeL);
        const pupilL = new THREE.Mesh(eyeBGeom, matB);
        pupilL.position.set(0, 0, 2);
        eyeL.add(pupilL);
        
        const eyeR = new THREE.Mesh(eyeWGeom, matW);
        eyeR.position.set(3, 19, 7);
        this.group.add(eyeR);
        const pupilR = new THREE.Mesh(eyeBGeom, matB);
        pupilR.position.set(0, 0, 2);
        eyeR.add(pupilR);

        this.group.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    startAttack() { this.state = 'attacking'; this.attackTimer = 0; }

    update(dt, crowdWorldY) {
        if (this.state === 'waiting' && !this.scaled && crowdWorldY >= this.worldY - 1500) {
            const playerPower = this.game.crowd.count;
            if (playerPower > 0) {
                // Dynamically balance phase HP to match player crowd strength.
                // Total Boss HP is scaled to playerPower * 2.0, split equally among all phases.
                // Consuming N units deals N * 3 damage, meaning the player consumes exactly 67% of their crowd
                // to beat all phases, leaving ~33% alive to celebrate and rescue the Princess.
                for (const phase of this.phases) {
                    phase.hp = Math.max(15, Math.floor(playerPower * 2.0 / this.phases.length));
                }
                this.maxHP = this.currentPhase.hp;
                this.hp = this.maxHP;
            }
            this.scaled = true;
        }

        if (this.state === 'attacking') {
            this.attackTimer += dt;
            this.shake = Utils.lerp(this.shake, 0, 0.1);
            
            // Apply shake to mesh
            this.group.position.x = (Math.random() - 0.5) * this.shake;

            while (this.attackTimer >= 0.04 && this.hp > 0 && this.game.crowd.count > 0) {
                this.attackTimer -= 0.04;
                
                // Scale damage so each phase takes ~0.4 seconds (approx 10 ticks)
                const unitsToRemove = Math.max(1, Math.ceil(this.maxHP / 30));
                const dmg = this.game.crowd.clashRemoveAmount(unitsToRemove);
                
                if (dmg > 0) {
                    const amplifiedDmg = dmg * 3;
                    this.hp = Math.max(0, this.hp - amplifiedDmg);
                    this.damageDealt += amplifiedDmg;
                    this.shake = 3;

                    if (this.damageDealt % 5 === 0) {
                        this.vec.setFromMatrixPosition(this.group.matrixWorld);
                        this.vec.project(this.game.camera);
                        const screenY = -(this.vec.y * 0.5 - 0.5) * GC.H;
                        const screenX = GC.W/2 + Utils.randomRange(-40, 40);
                        // Emit brick debris when boss takes damage
                        this.game.particles.brickDebris(screenX, screenY + 40, '#8800CC', 8);
                        this.game.particles.clashSparks(screenX, screenY, 4);
                    }
                }

                if (this.game.crowd.count <= 0) {
                    this.coinsEarned = this.damageDealt;
                    this.state = 'failed';
                    setTimeout(() => {
                        this.game.state = 'GAME_OVER';
                        if (typeof Android !== 'undefined' && Android.showBanner) {
                            try { Android.showBanner(); } catch(e) {}
                        }
                    }, 1000);
                    break;
                }
                if (this.hp <= 0) {
                    this.vec.setFromMatrixPosition(this.group.matrixWorld);
                    this.vec.project(this.game.camera);
                    const screenY = -(this.vec.y * 0.5 - 0.5) * GC.H;
                    
                    this.game.particles.coinExplosion(GC.W/2, screenY, 60);
                    this.game.particles.confetti(GC.W/2, screenY, 80);
                    this.game.screenFx.shake(16, 0.8);
                    this.game.screenFx.flash('rgba(255,220,0,0.7)', 0.5);
                    if (this.game.sound) this.game.sound.phaseTransition();

                    this.phaseIndex++;
                    if (this.phaseIndex < this.phases.length) {
                        this.currentPhase = this.phases[this.phaseIndex];
                        this.maxHP = this.currentPhase.hp;
                        this.hp = this.maxHP;
                        this.game.floatingText.spawn(`🔥 ${this.currentPhase.label}!`, GC.W/2, screenY - 60, '#FF8800');
                    } else {
                        this.state = 'destroyed';
                        this.coinsEarned = this.game.crowd.count * 2 + this.damageDealt;
                        this.game.particles.coinExplosion(GC.W/2, screenY, 120);
                        this.game.particles.confetti(GC.W/2, screenY, 150);
                        this.game.screenFx.shake(25, 1.2);
                        this.game.screenFx.flash('rgba(255,255,255,0.8)', 0.6);
                        if (this.game.sound) this.game.sound.victory();
                        const isLastLevel = this.game.currentLevel && this.game.currentLevel.id === 20;
                        if (isLastLevel) {
                            this._spawnPrincess();
                            setTimeout(() => this.game.showResults(), 4500);
                        } else {
                            setTimeout(() => this.game.showResults(), 2500);
                        }
                    }
                    break;
                }
            }
        }

        if (this.state === 'destroyed') {
            if (this.group.position.y > -40 && this.group.scale.x > 0.01) {
                this.group.position.y -= dt * 22;
                this.group.rotation.x += dt * 1.4;
                this.group.rotation.z += dt * 0.7;
                const newScale = Math.max(0, this.group.scale.x - dt * 0.65);
                this.group.scale.set(newScale, newScale, newScale);
                
                // Spawn cyberpunk debris while collapsing
                if (Math.random() < 0.25) {
                    this.vec.setFromMatrixPosition(this.group.matrixWorld);
                    this.vec.project(this.game.camera);
                    const screenY = -(this.vec.y * 0.5 - 0.5) * GC.H;
                    const screenX = GC.W/2 + Utils.randomRange(-30, 30);
                    this.game.particles.brickDebris(screenX, screenY + 40, '#8800CC', 5);
                }
            } else {
                this.group.visible = false;
            }
        }

        if (this.princessMesh) {
            const pt = (this.game.ui ? this.game.ui.t : 0);
            this.princessMesh.position.y = Math.abs(Math.sin(pt * 5.0)) * 2.0;
            this.princessMesh.rotation.y = Math.sin(pt * 2.0) * 0.2;
        }
    }

    draw(ctx, crowdWorldY) {
        if (this.state === 'destroyed' || this.state === 'failed') return;
        
        this.vec.setFromMatrixPosition(this.group.matrixWorld);
        this.vec.project(this.game.camera);
        if (this.vec.z > 1 || this.vec.z < -1) return;
        
        const screenX = (this.vec.x * 0.5 + 0.5) * GC.W;
        const screenY = -(this.vec.y * 0.5 - 0.5) * GC.H;
        
        const depth = Math.abs(this.game.camera.position.z - this.group.position.z);
        const scale = Utils.clamp(200 / depth, 0.2, 1.5);
        if (scale < 0.25) return;

        ctx.save();
        ctx.translate(screenX, screenY);

        // HP bar
        if (this.hp > 0) {
            const bw = 180 * scale, bh = 8 * scale;
            const by = -80 * scale;
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.beginPath(); ctx.roundRect(-bw/2 - 2, by - 2, bw + 4, bh + 4, 4*scale); ctx.fill();
            
            const pct = this.hp / this.maxHP;
            const bc = pct > 0.5 ? '#44FF44' : pct > 0.25 ? '#FFAA00' : '#FF4444';
            ctx.fillStyle = '#333'; ctx.fillRect(-bw/2, by, bw, bh);
            ctx.fillStyle = bc; ctx.fillRect(-bw/2, by, bw * pct, bh);
            
            ctx.fillStyle = '#FFF';
            ctx.font = `bold ${Math.max(7, Math.floor(9*scale))}px "Outfit", sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(`${this.hp}/${this.maxHP}`, 0, by + bh/2);
            
            // Phase indicator
            const phaseName = this.currentPhase ? this.currentPhase.label : 'Fortress';
            const totalPhases = this.phases ? this.phases.length : 1;
            
            ctx.fillStyle = 'rgba(0,0,0,0.65)';
            const lw = 170 * scale, lh = 22 * scale;
            ctx.beginPath(); ctx.roundRect(-lw/2, by - 25*scale, lw, lh, 6*scale); ctx.fill();
            ctx.fillStyle = '#FFF';
            ctx.font = `bold ${Math.max(9, Math.floor(11 * scale))}px "Outfit", sans-serif`;
            ctx.fillText(`🏰 ${phaseName}  [${(this.phaseIndex||0) + 1}/${totalPhases}]`, 0, by - 14*scale);
        }

        ctx.restore();
    }

    _spawnPrincess() {
        const princess = this._createPrincessModel();
        // Place her exactly where the boss stood
        princess.position.set(0, 0, -this.worldY * 0.15);
        this.game.scene.add(princess);
        this.princessMesh = princess;
        
        // Spawn floating text and particles
        this.game.floatingText.spawn("👑 PRINCESS RESCUED! 👑", GC.W / 2, GC.H / 3, "#FF69B4", 32);
        this.game.particles.confetti(GC.W / 2, GC.H / 3, 100);
    }

    _createPrincessModel() {
        const princessGroup = new THREE.Group();

        // Body/Dress (Pink dress)
        const dressMat = new THREE.MeshStandardMaterial({ color: 0xFF69B4, roughness: 0.3, metalness: 0.1 });
        const dress = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 2.2, 3.5, 16), dressMat);
        dress.position.y = 1.75;
        princessGroup.add(dress);

        // Head (Peach, slightly larger for cute proportions)
        const headMat = new THREE.MeshStandardMaterial({ color: 0xFFE0C0, roughness: 0.5 });
        const head = new THREE.Mesh(new THREE.SphereGeometry(1.4, 16, 16), headMat);
        head.position.y = 4.9;
        princessGroup.add(head);

        // Hair Base (Blonde)
        const hairMat = new THREE.MeshStandardMaterial({ color: 0xFFE066, roughness: 0.6 });
        
        // Hair Back (Long flowing hair)
        const hairBack = new THREE.Mesh(new THREE.SphereGeometry(1.3, 16, 16), hairMat);
        hairBack.scale.set(1.2, 1.6, 0.8);
        hairBack.position.set(0, 3.8, -0.8);
        princessGroup.add(hairBack);

        // Cute twintails
        const hairL = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 12), hairMat);
        hairL.position.set(-1.4, 5.0, -0.2);
        princessGroup.add(hairL);
        const hairR = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 12), hairMat);
        hairR.position.set(1.4, 5.0, -0.2);
        princessGroup.add(hairR);

        // Cute bangs (front hair)
        const bangs = new THREE.Mesh(new THREE.SphereGeometry(1.45, 16, 16, 0, Math.PI, 0, Math.PI/2), hairMat);
        bangs.position.set(0, 4.9, 0);
        bangs.rotation.x = -0.15;
        princessGroup.add(bangs);

        // Crown (Golden)
        const crownMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.1, metalness: 0.9 });
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.4, 0.5, 6), crownMat);
        crown.position.set(0, 6.2, 0);
        princessGroup.add(crown);

        // Eyes (larger, cute vertical oval eyes)
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), eyeMat);
        eyeL.scale.set(1, 1.5, 0.5);
        eyeL.position.set(-0.45, 4.8, 1.35);
        princessGroup.add(eyeL);
        
        const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), eyeMat);
        eyeR.scale.set(1, 1.5, 0.5);
        eyeR.position.set(0.45, 4.8, 1.35);
        princessGroup.add(eyeR);

        // Blushes (cute!)
        const blushMat = new THREE.MeshBasicMaterial({ color: 0xFF99AA });
        const blushL = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), blushMat);
        blushL.scale.set(1.5, 0.8, 0.5);
        blushL.position.set(-0.75, 4.5, 1.25);
        princessGroup.add(blushL);

        const blushR = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), blushMat);
        blushR.scale.set(1.5, 0.8, 0.5);
        blushR.position.set(0.75, 4.5, 1.25);
        princessGroup.add(blushR);

        // Cute Red Bow on her back
        const bowMat = new THREE.MeshStandardMaterial({ color: 0xFF0033, roughness: 0.3 });
        const bowL = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), bowMat);
        bowL.position.set(-0.4, 3.8, -1.8);
        princessGroup.add(bowL);
        const bowR = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), bowMat);
        bowR.position.set(0.4, 3.8, -1.8);
        princessGroup.add(bowR);
        const bowC = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), bowMat);
        bowC.position.set(0, 3.8, -1.9);
        princessGroup.add(bowC);

        princessGroup.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        // Slight overall scale boost
        princessGroup.scale.set(1.15, 1.15, 1.15);

        return princessGroup;
    }
}
