// ============================================================
// crowd.js — Player crowd using Three.js 3D meshes
// ============================================================

class Crowd {
    constructor(game) {
        this.game = game;
        this.units = [];
        this.count = 0;
        this.worldY = 0; // Maps to negative Z in 3D
        this.laneX = 0;  // -1 to 1 normalized lane position
        this.targetLaneX = 0;
        this.speed = GC.CROWD_SPEED;
        this.skinKey = 'default';
        this.displayCount = 0;
        
        this.group = new THREE.Group();
        if (this.game.scene) {
            this.game.scene.add(this.group);
        }

        // Setup unit materials & geometry
        this.geomBodyNormal = new THREE.CapsuleGeometry(1.2, 2.0, 4, 8);
        
        this.geomBodyGiant = new THREE.CapsuleGeometry(2.5, 4.0, 4, 12);
        
        this.matBlue = new THREE.MeshStandardMaterial({ 
            color: 0x0088FF, 
            roughness: 0.3, 
            metalness: 0.3,
            emissive: 0x0044FF,
            emissiveIntensity: 0.5
        });
        
        this.matGiant = new THREE.MeshStandardMaterial({ 
            color: 0xFF00FF,
            roughness: 0.3,
            metalness: 0.3,
            emissive: 0x880088,
            emissiveIntensity: 0.6
        });

        this.skinMaterialCache = {};
    }

    _applyTheme(theme) {
        if (theme === 'meadow') {
            // Cool vibrant green
            this.matBlue.color.setHex(0x11CC44);
            this.matBlue.emissive.setHex(0x008811);
            // Yellow giant
            this.matGiant.color.setHex(0xFFCC00);
            this.matGiant.emissive.setHex(0x886600);
        } else if (theme === 'desert') {
            // Fiery orange/red
            this.matBlue.color.setHex(0xFF5500);
            this.matBlue.emissive.setHex(0x992200);
            // Deep red giant
            this.matGiant.color.setHex(0xCC0022);
            this.matGiant.emissive.setHex(0x660011);
        } else if (theme === 'volcano') {
            // Lava red/orange
            this.matBlue.color.setHex(0xFF4500);
            this.matBlue.emissive.setHex(0x771100);
            // Glowing yellow lava giant
            this.matGiant.color.setHex(0xFFCC00);
            this.matGiant.emissive.setHex(0x884400);
        } else {
            // City / Default - Classic Cyan and Magenta
            this.matBlue.color.setHex(0x0088FF);
            this.matBlue.emissive.setHex(0x0044FF);
            this.matGiant.color.setHex(0xFF00FF);
            this.matGiant.emissive.setHex(0x880088);
        }
    }

    init(count, skinKey = 'default') {
        // Remove existing meshes and dispose of WebGL resources to prevent memory leaks
        for (const u of this.units) {
            this.group.remove(u.mesh);
            u.mesh.traverse(child => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        // Dispose of dynamic rainbow materials specifically
                        if (child.material.isRainbowMaterial) {
                            child.material.dispose();
                        }
                    }
                }
            });
        }
        this.units = [];
        
        this.count = count;
        this.worldY = 0;
        this.skinKey = skinKey;
        this.displayCount = count;
        this.laneX = 0;
        this.targetLaneX = 0;
        this.shielded = false;
        this.shieldTime = 0;
        this.dustAcc = 0;
        this.prevCount = count;
        
        this.group.position.set(0, 0, 0);

        for (let i = 0; i < Math.min(count, 150); i++) {
            this.units.push(this._makeUnit(false));
        }
    }

    activateShield(duration) {
        this.shielded = true;
        this.shieldTime = duration;
    }

    _makeUnit(animated = true, type = 'normal') {
        const isGiant = type === 'giant';
        const sf = isGiant ? 2.0 : 1.0;
        const skin = CROWD_SKINS[this.skinKey] || CROWD_SKINS.default;
        
        const unitGroup = new THREE.Group();
        let mainMesh = null;
        let rainbowMat = null;
        
        // Helper to retrieve or create cached materials for skins
        const getCachedMat = (key, hexColor, metalness = 0.2, roughness = 0.4) => {
            const cacheKey = `${key}_${isGiant ? 'giant' : 'normal'}`;
            if (!this.skinMaterialCache[cacheKey]) {
                this.skinMaterialCache[cacheKey] = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(hexColor),
                    metalness: metalness,
                    roughness: roughness,
                    emissive: new THREE.Color(hexColor).multiplyScalar(isGiant ? 0.6 : 0.2),
                    emissiveIntensity: isGiant ? 0.6 : 0.2
                });
            }
            return this.skinMaterialCache[cacheKey];
        };

        const matW = getCachedMat('eyeW', 0xFFFFFF, 0, 0.9);
        const matB = getCachedMat('eyeB', 0x000000, 0, 0.9);

        // Build composite meshes depending on selected skin
        if (skin.type === 'steve') {
            // Steve: Blue shirt torso, peach head, dark blue/indigo pants
            const torsoMat = getCachedMat('steveTorso', '#00B4D8', 0.1, 0.5);
            const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6 * sf, 1.8 * sf, 0.9 * sf), torsoMat);
            torsoMesh.position.y = 1.9 * sf;
            unitGroup.add(torsoMesh);
            mainMesh = torsoMesh;

            const headMat = getCachedMat('steveHead', '#E0A96D', 0.1, 0.5);
            const headMesh = new THREE.Mesh(new THREE.BoxGeometry(1.1 * sf, 1.1 * sf, 1.1 * sf), headMat);
            headMesh.position.set(0, 3.35 * sf, 0);
            unitGroup.add(headMesh);

            const legMat = getCachedMat('steveLegs', '#0077B6', 0.1, 0.5);
            const legMesh = new THREE.Mesh(new THREE.BoxGeometry(1.5 * sf, 1.0 * sf, 0.8 * sf), legMat);
            legMesh.position.y = 0.5 * sf;
            unitGroup.add(legMesh);

            // Boxy eyes
            const eyeWGeom = new THREE.BoxGeometry(0.25 * sf, 0.25 * sf, 0.1 * sf);
            const eyeBGeom = new THREE.BoxGeometry(0.12 * sf, 0.25 * sf, 0.1 * sf);

            const eyeL = new THREE.Mesh(eyeWGeom, matW);
            eyeL.position.set(-0.25 * sf, 0.1 * sf, 0.56 * sf);
            headMesh.add(eyeL);
            const pupilL = new THREE.Mesh(eyeBGeom, matB);
            pupilL.position.set(0.06 * sf, 0, 0.02 * sf);
            eyeL.add(pupilL);

            const eyeR = new THREE.Mesh(eyeWGeom, matW);
            eyeR.position.set(0.25 * sf, 0.1 * sf, 0.56 * sf);
            headMesh.add(eyeR);
            const pupilR = new THREE.Mesh(eyeBGeom, matB);
            pupilR.position.set(-0.06 * sf, 0, 0.02 * sf);
            eyeR.add(pupilR);

        } else if (skin.type === 'creeper') {
            // Creeper: Solid green blocky body, head, and feet
            const torsoMat = getCachedMat('creeperTorso', '#38B000', 0.1, 0.6);
            const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2 * sf, 1.8 * sf, 0.8 * sf), torsoMat);
            torsoMesh.position.y = 1.5 * sf;
            unitGroup.add(torsoMesh);
            mainMesh = torsoMesh;

            const headMat = getCachedMat('creeperHead', '#70E000', 0.1, 0.6);
            const headMesh = new THREE.Mesh(new THREE.BoxGeometry(1.3 * sf, 1.3 * sf, 1.3 * sf), headMat);
            headMesh.position.set(0, 3.05 * sf, 0);
            unitGroup.add(headMesh);

            const footMat = getCachedMat('creeperFeet', '#007200', 0.1, 0.6);
            const footGeom = new THREE.BoxGeometry(0.5 * sf, 0.6 * sf, 0.5 * sf);
            
            const fl1 = new THREE.Mesh(footGeom, footMat);
            fl1.position.set(-0.35 * sf, 0.3 * sf, 0.25 * sf);
            unitGroup.add(fl1);

            const fr1 = new THREE.Mesh(footGeom, footMat);
            fr1.position.set(0.35 * sf, 0.3 * sf, 0.25 * sf);
            unitGroup.add(fr1);

            const fl2 = new THREE.Mesh(footGeom, footMat);
            fl2.position.set(-0.35 * sf, 0.3 * sf, -0.25 * sf);
            unitGroup.add(fl2);

            const fr2 = new THREE.Mesh(footGeom, footMat);
            fr2.position.set(0.35 * sf, 0.3 * sf, -0.25 * sf);
            unitGroup.add(fr2);

            // Black blocky eyes
            const eyeGeom = new THREE.BoxGeometry(0.24 * sf, 0.24 * sf, 0.1 * sf);
            
            const eyeL = new THREE.Mesh(eyeGeom, matB);
            eyeL.position.set(-0.25 * sf, 0.15 * sf, 0.66 * sf);
            headMesh.add(eyeL);

            const eyeR = new THREE.Mesh(eyeGeom, matB);
            eyeR.position.set(0.25 * sf, 0.15 * sf, 0.66 * sf);
            headMesh.add(eyeR);

        } else if (skin.type === 'devil') {
            // Devil: Red capsule body with horns
            const geomBody = isGiant ? this.geomBodyGiant : this.geomBodyNormal;
            const devilMat = getCachedMat('devilBody', '#D90429', 0.2, 0.3);
            const body = new THREE.Mesh(geomBody, devilMat);
            body.position.y = isGiant ? 4.5 : 2.2;
            unitGroup.add(body);
            mainMesh = body;

            // Small black horns
            const hornMat = getCachedMat('devilHorns', '#111111', 0.1, 0.5);
            const hornGeom = new THREE.ConeGeometry(0.22 * sf, 0.7 * sf, 4);

            const hornL = new THREE.Mesh(hornGeom, hornMat);
            hornL.position.set(-0.6 * sf, isGiant ? 2.5 * sf : 1.2 * sf, 0.3 * sf);
            hornL.rotation.z = 0.4;
            body.add(hornL);

            const hornR = new THREE.Mesh(hornGeom, hornMat);
            hornR.position.set(0.6 * sf, isGiant ? 2.5 * sf : 1.2 * sf, 0.3 * sf);
            hornR.rotation.z = -0.4;
            body.add(hornR);

            // Spherical eyes
            const eyeWGeom = new THREE.SphereGeometry(isGiant ? 0.7 : 0.35, 8, 8);
            const eyeBGeom = new THREE.SphereGeometry(isGiant ? 0.25 : 0.12, 8, 8);

            const yOffset = isGiant ? 1.5 : 0.8;
            const zOffset = isGiant ? 2.2 : 1.0;
            const xOffset = isGiant ? 0.8 : 0.4;

            const eyeL = new THREE.Mesh(eyeWGeom, matW);
            eyeL.position.set(-xOffset, yOffset, zOffset);
            body.add(eyeL);
            const pupilL = new THREE.Mesh(eyeBGeom, matB);
            pupilL.position.set(0, 0, isGiant ? 0.6 : 0.3);
            eyeL.add(pupilL);

            const eyeR = new THREE.Mesh(eyeWGeom, matW);
            eyeR.position.set(xOffset, yOffset, zOffset);
            body.add(eyeR);
            const pupilR = new THREE.Mesh(eyeBGeom, matB);
            pupilR.position.set(0, 0, isGiant ? 0.6 : 0.3);
            eyeR.add(pupilR);

        } else if (skin.type === 'robot') {
            // Robot: Metallic box torso, light green/metallic head, antenna
            const torsoMat = getCachedMat('robotTorso', '#73A942', 0.8, 0.2);
            const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(1.5 * sf, 1.7 * sf, 1.0 * sf), torsoMat);
            torsoMesh.position.y = 1.35 * sf;
            unitGroup.add(torsoMesh);
            mainMesh = torsoMesh;

            const headMat = getCachedMat('robotHead', '#ADF7B6', 0.8, 0.2);
            const headMesh = new THREE.Mesh(new THREE.BoxGeometry(1.1 * sf, 1.1 * sf, 1.1 * sf), headMat);
            headMesh.position.set(0, 2.75 * sf, 0);
            unitGroup.add(headMesh);

            const antMat = getCachedMat('robotAntenna', '#1A5F7A', 0.9, 0.1);
            const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * sf, 0.08 * sf, 0.5 * sf, 4), antMat);
            antenna.position.set(0, 0.8 * sf, 0);
            headMesh.add(antenna);

            const tipMat = getCachedMat('robotTip', '#FFAA00', 0, 0.5);
            const tip = new THREE.Mesh(new THREE.SphereGeometry(0.18 * sf, 8, 8), tipMat);
            tip.position.y = 0.3 * sf;
            antenna.add(tip);

            // Glowing yellow eyes
            const eyeMat = getCachedMat('robotEyes', '#FFD700', 0.1, 0.4);
            const eyeGeom = new THREE.SphereGeometry(0.16 * sf, 8, 8);

            const eyeL = new THREE.Mesh(eyeGeom, eyeMat);
            eyeL.position.set(-0.28 * sf, 0.1 * sf, 0.56 * sf);
            headMesh.add(eyeL);

            const eyeR = new THREE.Mesh(eyeGeom, eyeMat);
            eyeR.position.set(0.28 * sf, 0.1 * sf, 0.56 * sf);
            headMesh.add(eyeR);

        } else if (skin.type === 'rainbow') {
            // Rainbow: Standard capsule but holds a dynamic material instance
            const geomBody = isGiant ? this.geomBodyGiant : this.geomBodyNormal;
            rainbowMat = new THREE.MeshStandardMaterial({
                color: 0xFF00FF,
                roughness: 0.3,
                metalness: 0.3,
                emissive: 0x440044,
                emissiveIntensity: 0.5
            });
            rainbowMat.isRainbowMaterial = true; // Flag for GC disposal on cleanup

            const body = new THREE.Mesh(geomBody, rainbowMat);
            body.position.y = isGiant ? 4.5 : 2.2;
            unitGroup.add(body);
            mainMesh = body;

            const eyeWGeom = new THREE.SphereGeometry(isGiant ? 0.7 : 0.35, 8, 8);
            const eyeBGeom = new THREE.SphereGeometry(isGiant ? 0.25 : 0.12, 8, 8);

            const yOffset = isGiant ? 1.5 : 0.8;
            const zOffset = isGiant ? 2.2 : 1.0;
            const xOffset = isGiant ? 0.8 : 0.4;

            const eyeL = new THREE.Mesh(eyeWGeom, matW);
            eyeL.position.set(-xOffset, yOffset, zOffset);
            body.add(eyeL);
            const pupilL = new THREE.Mesh(eyeBGeom, matB);
            pupilL.position.set(0, 0, isGiant ? 0.6 : 0.3);
            eyeL.add(pupilL);

            const eyeR = new THREE.Mesh(eyeWGeom, matW);
            eyeR.position.set(xOffset, yOffset, zOffset);
            body.add(eyeR);
            const pupilR = new THREE.Mesh(eyeBGeom, matB);
            pupilR.position.set(0, 0, isGiant ? 0.6 : 0.3);
            eyeR.add(pupilR);

        } else {
            // Default capsule styling
            const geomBody = isGiant ? this.geomBodyGiant : this.geomBodyNormal;
            const mat = isGiant ? this.matGiant : this.matBlue;
            const body = new THREE.Mesh(geomBody, mat);
            body.position.y = isGiant ? 4.5 : 2.2;
            unitGroup.add(body);
            mainMesh = body;

            const eyeWGeom = new THREE.SphereGeometry(isGiant ? 0.7 : 0.35, 8, 8);
            const eyeBGeom = new THREE.SphereGeometry(isGiant ? 0.25 : 0.12, 8, 8);

            const yOffset = isGiant ? 1.5 : 0.8;
            const zOffset = isGiant ? 2.2 : 1.0;
            const xOffset = isGiant ? 0.8 : 0.4;

            const eyeL = new THREE.Mesh(eyeWGeom, matW);
            eyeL.position.set(-xOffset, yOffset, zOffset);
            body.add(eyeL);
            const pupilL = new THREE.Mesh(eyeBGeom, matB);
            pupilL.position.set(0, 0, isGiant ? 0.6 : 0.3);
            eyeL.add(pupilL);

            const eyeR = new THREE.Mesh(eyeWGeom, matW);
            eyeR.position.set(xOffset, yOffset, zOffset);
            body.add(eyeR);
            const pupilR = new THREE.Mesh(eyeBGeom, matB);
            pupilR.position.set(0, 0, isGiant ? 0.6 : 0.3);
            eyeR.add(pupilR);
        }

        // Random cluster position (Tightly packed like a swarm)
        // Clamp the visual radius so massive crowds don't spill off screen
        const maxRadius = isGiant ? 3 : Math.min(18, 2.5 + Math.sqrt(this.count) * 0.3);
        const radius = isGiant ? 3 : Utils.randomRange(0.5, maxRadius);
        const angle = Utils.randomRange(0, Math.PI * 2);
        
        unitGroup.position.x = Math.cos(angle) * radius;
        unitGroup.position.z = Math.sin(angle) * radius;
        unitGroup.position.y = 0; // Group sits on ground
        
        if (animated) {
            unitGroup.scale.set(0, 0, 0);
        }
        
        this.group.add(unitGroup);
        
        return {
            mesh: unitGroup,
            type: type,
            hp: isGiant ? 5 : 1,
            phase: Utils.randomRange(0, Math.PI * 2),
            speed: isGiant ? Utils.randomRange(8, 12) : Utils.randomRange(15, 20),
            targetScale: 1,
            scale: animated ? 0 : 1,
            alive: true,
            ox: unitGroup.position.x,
            oz: unitGroup.position.z,
            rainbowMat: rainbowMat
        };
    }

    addUnits(n, type = 'normal') {
        this.count += n;
        const toAdd = Math.min(n, 150 - this.units.filter(u => u.alive).length);
        for (let i = 0; i < toAdd; i++) this.units.push(this._makeUnit(true, type));
    }

    removeUnits(n) {
        let removed = 0;
        for (let i = this.units.length - 1; i >= 0 && removed < n; i--) {
            if (this.units[i].alive) {
                this.units[i].alive = false;
                this.units[i].targetScale = 0;
                removed++;
            }
        }
        this.count = Math.max(0, this.count - n);
    }

    applyGate(type, value) {
        let nc = this.count;
        switch (type) {
            case 'multiply': nc = Math.floor(nc * value); break;
            case 'add': nc = nc + value; break;
            case 'divide': nc = Math.max(0, Math.floor(nc / value)); break;
            case 'subtract': nc = Math.max(0, nc - value); break;
        }
        nc = Math.max(0, nc);
        const diff = nc - this.count;
        if (diff > 0) this.addUnits(diff);
        else if (diff < 0) this.removeUnits(-diff);
    }

    clashRemoveAmount(amount) {
        if (amount <= 0 || this.count <= 0) return 0;
        
        let removed = 0;
        let damage = 0;
        
        // Remove up to 3 visual units per tick for visual flair
        let visualRemoves = Math.min(amount, 3);
        
        for (let i = this.units.length - 1; i >= 0 && visualRemoves > 0; i--) {
            const u = this.units[i];
            if (u.alive) {
                if (u.type === 'giant') {
                    u.hp--;
                    if (u.hp <= 0) {
                        u.alive = false;
                        u.targetScale = 0;
                        this.count = Math.max(0, this.count - 1);
                        visualRemoves--;
                        removed++;
                        damage += 3;
                    } else {
                        visualRemoves--;
                        damage += 3;
                    }
                } else {
                    u.alive = false;
                    u.targetScale = 0;
                    this.count = Math.max(0, this.count - 1);
                    visualRemoves--;
                    removed++;
                    damage += 1;
                }
            }
        }
        
        // Subtract the rest mathematically
        const remainingToRemove = Math.min(amount - removed, this.count);
        if (remainingToRemove > 0) {
            this.count -= remainingToRemove;
            damage += remainingToRemove; // Assume normal units for mathematical subtraction
        }
        
        return damage;
    }

    update(dt, moving = true) {
        this.speed = this.game.shop.getSpeed();
        if (moving) {
            this.worldY += this.speed * dt * 60;
        }
        
        // Map 2D worldY to 3D Z-axis
        this.group.position.z = -this.worldY * 0.15;
        
        const lerpFactor = 1 - Math.pow(1 - 0.18, dt * 60);
        this.displayCount = Utils.lerp(this.displayCount, this.count, 1 - Math.pow(1 - 0.15, dt * 60));
        
        this.laneX = Utils.lerp(this.laneX, this.targetLaneX, lerpFactor);
        
        this.group.position.x = this.laneX * 35; 

        // Shield decay
        if (this.shielded && this.shieldTime > 0) {
            this.shieldTime -= dt;
            if (this.shieldTime <= 0) { this.shielded = false; this.shieldTime = 0; }
        }

        // Replenish visual units if needed (up to 150 max)
        const aliveCount = this.units.filter(u => u.alive).length;
        const desiredVisuals = Math.min(this.count, 150);
        if (aliveCount < desiredVisuals) {
            const toAdd = desiredVisuals - aliveCount;
            for (let i = 0; i < toAdd; i++) {
                let recycled = false;
                for (let j = 0; j < this.units.length; j++) {
                    if (!this.units[j].alive && this.units[j].scale < 0.05 && this.units[j].type === 'normal') {
                        // Recycle dead normal unit
                        this.units[j].alive = true;
                        this.units[j].targetScale = 1;
                        
                        const maxRadius = Math.min(18, 2.5 + Math.sqrt(this.count) * 0.3);
                        const radius = Utils.randomRange(0.5, maxRadius);
                        const angle = Utils.randomRange(0, Math.PI * 2);
                        this.units[j].ox = Math.cos(angle) * radius;
                        this.units[j].oz = Math.sin(angle) * radius;
                        
                        // Instantly teleport to center if currently fighting so they don't fly in from miles away
                        if (!moving) {
                            this.units[j].mesh.position.x = this.units[j].ox;
                            this.units[j].mesh.position.z = this.units[j].oz;
                        }
                        
                        recycled = true;
                        break;
                    }
                }
                if (!recycled) this.units.push(this._makeUnit(true, 'normal'));
            }
        }

        // Bobbing animation and scaling
        for (let i = this.units.length - 1; i >= 0; i--) {
            const u = this.units[i];
            
            if (u.alive && u.rainbowMat) {
                const uiTime = this.game.ui ? this.game.ui.t : 0;
                const hue = (uiTime * 90 + i * 6) % 360;
                u.rainbowMat.color.setHSL(hue / 360, 0.95, 0.5);
                u.rainbowMat.emissive.setHSL(hue / 360, 0.95, 0.2);
            }
            
            if (u.alive) {
                u.phase += u.speed * dt;
                u.mesh.position.y = Math.abs(Math.sin(u.phase)) * 2;
                
                // Spread out based on count, clamp so it doesn't get ridiculously large
                const spreadScale = Math.min(1 + Math.sqrt(Math.min(this.count, 2000)) * 0.05, 1.8);
                let tx = u.ox * spreadScale;
                let tz = u.oz * spreadScale;
                
                if (!moving) {
                    if (u.ringAngle === undefined) u.ringAngle = Math.atan2(u.oz, u.ox);
                    u.ringAngle += dt * 3.5;
                    const ringRadius = 12 + spreadScale * 5 + Math.random() * 6;
                    tx = Math.cos(u.ringAngle) * ringRadius;
                    tz = Math.sin(u.ringAngle) * ringRadius;
                } else {
                    if (u.ringAngle !== undefined) u.ringAngle = undefined;
                }
                
                u.mesh.position.x = Utils.lerp(u.mesh.position.x, tx, 0.15);
                u.mesh.position.z = Utils.lerp(u.mesh.position.z, tz, 0.15);
            }
            
            u.scale = Utils.lerp(u.scale, u.targetScale, 0.15);
            u.mesh.scale.set(u.scale, u.scale, u.scale);
            
            if (!u.alive && u.scale < 0.01) {
                u.mesh.visible = false;
            } else {
                u.mesh.visible = true;
            }
        }
    }
}
