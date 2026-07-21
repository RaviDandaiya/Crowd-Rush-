// ============================================================
// obstacles.js — Dynamic hazards using Three.js meshes
// ============================================================

class ObstacleManager {
    constructor(game) {
        this.game = game;
        this.obstacles = [];
        this.group = new THREE.Group();
        this.game.scene.add(this.group);
        this.vec = new THREE.Vector3();
    }

    init(levelData) {
        // Cleanup old meshes
        while(this.group.children.length > 0){ 
            this.group.remove(this.group.children[0]); 
        }
        this.obstacles = [];
        
        // If levelData has obstacles, we build them
        if (levelData.obstacles) {
            for (const obs of levelData.obstacles) {
                let mesh;
                if (obs.type === 'saw') {
                    mesh = new THREE.Mesh(
                        new THREE.CylinderGeometry(8, 8, 2, 16),
                        new THREE.MeshStandardMaterial({color: 0x888888, metalness: 0.8})
                    );
                    mesh.rotation.x = Math.PI / 2;
                } else if (obs.type === 'pit') {
                    const w = obs.width || 20;
                    mesh = new THREE.Mesh(
                        new THREE.BoxGeometry(w, 0.4, 25),
                        new THREE.MeshBasicMaterial({color: obs.isLava ? 0xFF3300 : 0x111111})
                    );
                } else if (obs.type === 'hammer') {
                    mesh = new THREE.Mesh(
                        new THREE.BoxGeometry(10, 5, 5),
                        new THREE.MeshStandardMaterial({color: 0x444444})
                    );
                } else {
                    mesh = new THREE.Mesh(new THREE.BoxGeometry(5,5,5), new THREE.MeshBasicMaterial({color:0xFF0000}));
                }
                
                this.group.add(mesh);
                
                this.obstacles.push({
                    ...obs,
                    mesh: mesh,
                    active: true,
                    phase: 0
                });
            }
        }
    }

    update(dt, crowdY) {
        for (const obs of this.obstacles) {
            if (!obs.active) continue;
            const dist = obs.y - crowdY;
            
            // Map world Y to Z position
            const zPos = -obs.y * 0.15;
            
            if (Math.abs(dist) < 1500) {
                obs.phase += dt * (obs.speed || 3);
            }

            let obsX = 0;
            let obsY = 1;

            if (obs.type === 'saw') {
                const laneOff = Math.sin(obs.phase) * (obs.range || 0.6);
                obsX = laneOff * 35; // 35 is max side distance
                obs.mesh.rotation.y += dt * 10;
            } else if (obs.type === 'hammer') {
                // Swing rotation around Z-axis (left/right swing)
                const angle = Math.sin(obs.phase) * (Math.PI / 2.2); // Swing angle
                obsX = (obs.laneX || 0) * 35;
                
                const pivotY = 25;
                const armLength = 22;
                obsY = pivotY - Math.cos(angle) * armLength;
                obsX += Math.sin(angle) * armLength;
                
                obs.mesh.rotation.z = -angle; // Rotate the block to match swing
            } else if (obs.type === 'pit') {
                const offset = Math.sin(obs.phase * 0.7) * 0.5;
                obsX = ((obs.laneX || 0) + offset) * 35;
                obsY = 0.1; // flat on ground
            }

            obs.mesh.position.set(obsX, obsY, zPos);

            // Check collision
            if (dist > -50 && dist < 50) {
                this.checkCollision(obs, obsX, zPos);
            }
        }
    }

    checkCollision(obs, obsX, obsZ) {
        if (!this.game.crowd || this.game.crowd.count <= 0) return;
        
        let removed = 0;
        const units = this.game.crowd.units;
        const crowdGroup = this.game.crowd.group;
        
        // Bounding dimensions
        const isPit = obs.type === 'pit';
        const isSaw = obs.type === 'saw';
        const isHammer = obs.type === 'hammer';
        
        const pitW = obs.width || 20;
        const pitL = 25;
        
        const sawRadius = 8;
        const hammerW = 10;
        const hammerL = 6;

        for (let i = units.length - 1; i >= 0; i--) {
            const u = units[i];
            if (!u.alive) continue;
            
            // Calculate absolute world coordinates of unit
            const uWorldX = u.mesh.position.x + crowdGroup.position.x;
            const uWorldZ = u.mesh.position.z + crowdGroup.position.z;
            
            let isHit = false;
            
            if (isPit) {
                // AABB Check
                const dx = Math.abs(uWorldX - obsX);
                const dz = Math.abs(uWorldZ - obsZ);
                if (dx < pitW / 2 && dz < pitL / 2) {
                    isHit = true;
                }
            } else if (isSaw) {
                // Circle Check
                const dx = uWorldX - obsX;
                const dz = uWorldZ - obsZ;
                if (dx * dx + dz * dz < sawRadius * sawRadius) {
                    isHit = true;
                }
            } else if (isHammer) {
                // Check if hammer is low enough to hit and intersects unit
                const dx = Math.abs(uWorldX - obsX);
                const dz = Math.abs(uWorldZ - obsZ);
                const hammerY = obs.mesh.position.y;
                if (dx < hammerW / 2 && dz < hammerL / 2 && hammerY < 10) {
                    isHit = true;
                }
            } else {
                // Fallback check
                const dx = uWorldX - obsX;
                const dz = uWorldZ - obsZ;
                if (dx * dx + dz * dz < 64) {
                    isHit = true;
                }
            }

            if (isHit) {
                const isProtected = this.game.crowd.shielded || this.game.feverActive;
                if (!isProtected && removed < 2) {
                    u.alive = false;
                    u.targetScale = 0;
                    removed++;
                    if (this.game.particles) {
                        this.vec.set(uWorldX, 1.2, uWorldZ);
                        this.vec.project(this.game.camera);
                        const sx = (this.vec.x * 0.5 + 0.5) * GC.W;
                        const sy = -(this.vec.y * 0.5 - 0.5) * GC.H;
                        
                        let popColor = '#0088FF';
                        if (isPit && obs.isLava) {
                            popColor = '#FF5500';
                        } else {
                            const activeSkin = CROWD_SKINS[this.game.crowd.skinKey];
                            if (activeSkin) {
                                popColor = activeSkin.body === 'rainbow' ? `hsl(${Math.random() * 360}, 100%, 65%)` : activeSkin.body;
                            }
                        }
                        this.game.particles.unitPop(sx, sy, popColor);
                        if (isPit && obs.isLava) {
                            // Extra splash particles
                            this.game.particles.burst(sx, sy, 3, ['#FFCC00', '#FF3300'], 40, 90, 0.4, 0.8, 1, 2, 'circle', 120);
                        }
                    }
                } else if (isProtected) {
                    if (this.game.particles && Math.random() < 0.2) {
                        this.vec.set(uWorldX, 1.2, uWorldZ);
                        this.vec.project(this.game.camera);
                        const sx = (this.vec.x * 0.5 + 0.5) * GC.W;
                        const sy = -(this.vec.y * 0.5 - 0.5) * GC.H;
                        this.game.particles.burst(sx, sy, 2, ['#00FFEE', '#FF00AA', '#FFFFFF'], 20, 60, 0.3, 0.6, 1, 3, 'circle', 100);
                    }
                }
            }
        }
        
        if (removed > 0) {
            this.game.crowd.count = Math.max(0, this.game.crowd.count - removed);
            if (this.game.sound && typeof this.game.sound.clash === 'function') {
                this.game.sound.clash();
            }
        }
    }

    draw(ctx, crowdY) {
        // Meshes are drawn by Three.js renderer
        // No 2D overlay needed for obstacles currently
    }
}
