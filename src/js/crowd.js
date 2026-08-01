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
        let unitSkinType = skin.type;
        if (this.game.currentLevel && this.game.currentLevel.id === 20) {
            const aliveNormalCount = this.units.filter(u => u.alive && u.type === 'normal').length;
            if (aliveNormalCount === 0 && type !== 'giant') {
                unitSkinType = 'prince';
            } else {
                unitSkinType = 'soldier';
            }
        }
        
        const unitGroup = new THREE.Group();
        let mainMesh = null;
        let rainbowMat = null;
        let swordMesh = null;
        
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

        } else if (skin.type === 'ninja') {
            // Cyber Ninja: Dark purple suit with glowing cyan visor & back swords
            const ninjaMat = getCachedMat('ninjaBody', '#4B0082', 0.5, 0.3);
            const geomBody = isGiant ? this.geomBodyGiant : this.geomBodyNormal;
            const body = new THREE.Mesh(geomBody, ninjaMat);
            body.position.y = isGiant ? 4.5 : 2.2;
            unitGroup.add(body);
            mainMesh = body;

            // Glowing cyan visor
            const visorMat = getCachedMat('ninjaVisor', '#00FFFF', 0.1, 0.1);
            visorMat.emissive = new THREE.Color('#00FFFF');
            visorMat.emissiveIntensity = 0.8;
            const visor = new THREE.Mesh(new THREE.BoxGeometry(1.2 * sf, 0.35 * sf, 0.5 * sf), visorMat);
            visor.position.set(0, isGiant ? 1.5 : 0.8, isGiant ? 2.2 : 1.0);
            body.add(visor);

            // Katana hilts on back
            const katanaMat = getCachedMat('ninjaSword', '#8A2BE2', 0.8, 0.2);
            const k1 = new THREE.Mesh(new THREE.BoxGeometry(0.15 * sf, 1.4 * sf, 0.15 * sf), katanaMat);
            k1.position.set(-0.4 * sf, isGiant ? 1.2 : 0.6, -1.0 * sf);
            k1.rotation.z = -0.5;
            body.add(k1);

        } else if (skin.type === 'superhero') {
            // Superhero: Red body, gold chest icon, blue cape
            const heroMat = getCachedMat('heroBody', '#E63946', 0.3, 0.4);
            const geomBody = isGiant ? this.geomBodyGiant : this.geomBodyNormal;
            const body = new THREE.Mesh(geomBody, heroMat);
            body.position.y = isGiant ? 4.5 : 2.2;
            unitGroup.add(body);
            mainMesh = body;

            // Gold chest emblem
            const goldMat = getCachedMat('heroEmblem', '#FFD166', 0.7, 0.3);
            const emblem = new THREE.Mesh(new THREE.OctahedronGeometry(0.4 * sf), goldMat);
            emblem.position.set(0, isGiant ? 0.5 : 0.2, isGiant ? 2.3 : 1.1);
            body.add(emblem);

            // Flowing blue cape
            const capeMat = getCachedMat('heroCape', '#1D3557', 0.1, 0.6);
            const cape = new THREE.Mesh(new THREE.BoxGeometry(1.4 * sf, 2.2 * sf, 0.1 * sf), capeMat);
            cape.position.set(0, isGiant ? 0.5 : 0.2, -1.0 * sf);
            cape.rotation.x = 0.3;
            body.add(cape);

            // Eyes
            const eyeL = new THREE.Mesh(new THREE.SphereGeometry(isGiant ? 0.35 : 0.2, 8, 8), matW);
            eyeL.position.set(-0.35 * sf, isGiant ? 1.5 : 0.8, isGiant ? 2.2 : 1.0);
            body.add(eyeL);
            const eyeR = new THREE.Mesh(new THREE.SphereGeometry(isGiant ? 0.35 : 0.2, 8, 8), matW);
            eyeR.position.set(0.35 * sf, isGiant ? 1.5 : 0.8, isGiant ? 2.2 : 1.0);
            body.add(eyeR);

        } else if (skin.type === 'gold_king') {
            // Golden King: Ultra metallic gold body with crown
            const kingMat = getCachedMat('kingBody', '#FFD700', 0.95, 0.1);
            kingMat.emissive = new THREE.Color('#DAA520');
            kingMat.emissiveIntensity = 0.4;
            const geomBody = isGiant ? this.geomBodyGiant : this.geomBodyNormal;
            const body = new THREE.Mesh(geomBody, kingMat);
            body.position.y = isGiant ? 4.5 : 2.2;
            unitGroup.add(body);
            mainMesh = body;

            // Golden Crown
            const crownMat = getCachedMat('kingCrown', '#FFF8DC', 0.9, 0.1);
            const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.7 * sf, 0.5 * sf, 0.5 * sf, 6), crownMat);
            crown.position.set(0, isGiant ? 3.0 : 1.6, 0);
            body.add(crown);

            // Eyes
            const eyeL = new THREE.Mesh(new THREE.SphereGeometry(isGiant ? 0.35 : 0.2, 8, 8), matB);
            eyeL.position.set(-0.35 * sf, isGiant ? 1.5 : 0.8, isGiant ? 2.2 : 1.0);
            body.add(eyeL);
            const eyeR = new THREE.Mesh(new THREE.SphereGeometry(isGiant ? 0.35 : 0.2, 8, 8), matB);
            eyeR.position.set(0.35 * sf, isGiant ? 1.5 : 0.8, isGiant ? 2.2 : 1.0);
            body.add(eyeR);

        } else if (unitSkinType === 'prince') {
            // Prince: Royal blue outfit, golden crown, red cape, eyes
            const royalMat = getCachedMat('princeRoyal', '#1E40AF', 0.2, 0.4);
            const geomBody = isGiant ? this.geomBodyGiant : this.geomBodyNormal;
            const body = new THREE.Mesh(geomBody, royalMat);
            body.position.y = isGiant ? 4.5 : 2.2;
            unitGroup.add(body);
            mainMesh = body;

            // Golden Crown
            const crownMat = getCachedMat('princeCrown', '#D97706', 0.9, 0.1);
            const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.6 * sf, 0.4 * sf, 0.4 * sf, 6), crownMat);
            crown.position.set(0, isGiant ? 3.0 : 1.6, 0);
            body.add(crown);

            // Red Cape
            const capeMat = getCachedMat('princeCape', '#DC2626', 0.1, 0.6);
            const cape = new THREE.Mesh(new THREE.BoxGeometry(1.3 * sf, 2.0 * sf, 0.1 * sf), capeMat);
            cape.position.set(0, isGiant ? 0.5 : 0.2, -0.9 * sf);
            cape.rotation.x = 0.25;
            body.add(cape);

            // Eyes
            const eyeL = new THREE.Mesh(new THREE.SphereGeometry(isGiant ? 0.35 : 0.2, 8, 8), matB);
            eyeL.position.set(-0.35 * sf, isGiant ? 1.5 : 0.8, isGiant ? 2.2 : 1.0);
            body.add(eyeL);
            const eyeR = new THREE.Mesh(new THREE.SphereGeometry(isGiant ? 0.35 : 0.2, 8, 8), matB);
            eyeR.position.set(0.35 * sf, isGiant ? 1.5 : 0.8, isGiant ? 2.2 : 1.0);
            body.add(eyeR);

            // Golden Prince Sword
            const swordGroup = new THREE.Group();
            const bladeGeom = new THREE.BoxGeometry(0.25 * sf, 1.8 * sf, 0.08 * sf);
            const bladeMat = getCachedMat('princeSwordBlade', '#E2E8F0', 0.9, 0.1);
            const blade = new THREE.Mesh(bladeGeom, bladeMat);
            blade.position.y = 0.9 * sf;
            swordGroup.add(blade);
            const guardGeom = new THREE.BoxGeometry(0.8 * sf, 0.15 * sf, 0.15 * sf);
            const guardMat = getCachedMat('princeSwordGuard', '#F59E0B', 0.8, 0.2);
            const guard = new THREE.Mesh(guardGeom, guardMat);
            swordGroup.add(guard);
            const handleGeom = new THREE.CylinderGeometry(0.1 * sf, 0.1 * sf, 0.5 * sf, 6);
            const handleMat = getCachedMat('princeSwordHandle', '#78350F', 0.1, 0.8);
            const handle = new THREE.Mesh(handleGeom, handleMat);
            handle.position.y = -0.25 * sf;
            swordGroup.add(handle);
            swordGroup.position.set(1.1 * sf, 0, 0.6 * sf);
            swordGroup.rotation.set(0.2, 0, -0.3);
            body.add(swordGroup);
            swordMesh = swordGroup;

        } else if (unitSkinType === 'soldier') {
            // Soldier: Steel/metallic body, red shoulder/chest plates, steel helmet
            const steelMat = getCachedMat('soldierSteel', '#94A3B8', 0.8, 0.2); // shiny steel
            const geomBody = isGiant ? this.geomBodyGiant : this.geomBodyNormal;
            const body = new THREE.Mesh(geomBody, steelMat);
            body.position.y = isGiant ? 4.5 : 2.2;
            unitGroup.add(body);
            mainMesh = body;

            // Soldier helmet
            const helmetMat = getCachedMat('soldierHelmet', '#64748B', 0.8, 0.2);
            const helmet = new THREE.Mesh(new THREE.CylinderGeometry(0.7 * sf, 0.7 * sf, 0.5 * sf, 8), helmetMat);
            helmet.position.set(0, isGiant ? 2.8 : 1.5, 0);
            body.add(helmet);

            // Red chest emblem / sash
            const sashMat = getCachedMat('soldierSash', '#DC2626', 0.1, 0.6);
            const sash = new THREE.Mesh(new THREE.BoxGeometry(1.2 * sf, 0.3 * sf, 0.25 * sf), sashMat);
            sash.position.set(0, isGiant ? 0.8 : 0.4, isGiant ? 2.1 : 0.95);
            body.add(sash);

            // Eyes
            const eyeL = new THREE.Mesh(new THREE.SphereGeometry(isGiant ? 0.35 : 0.2, 8, 8), matB);
            eyeL.position.set(-0.35 * sf, isGiant ? 1.5 : 0.8, isGiant ? 2.2 : 1.0);
            body.add(eyeL);
            const eyeR = new THREE.Mesh(new THREE.SphereGeometry(isGiant ? 0.35 : 0.2, 8, 8), matB);
            eyeR.position.set(0.35 * sf, isGiant ? 1.5 : 0.8, isGiant ? 2.2 : 1.0);
            body.add(eyeR);

            // Soldier Sword
            const swordGroup = new THREE.Group();
            const bladeGeom = new THREE.BoxGeometry(0.2 * sf, 1.4 * sf, 0.06 * sf);
            const bladeMat = getCachedMat('soldierSwordBlade', '#CBD5E1', 0.8, 0.2);
            const blade = new THREE.Mesh(bladeGeom, bladeMat);
            blade.position.y = 0.7 * sf;
            swordGroup.add(blade);
            const guardGeom = new THREE.BoxGeometry(0.6 * sf, 0.12 * sf, 0.12 * sf);
            const guardMat = getCachedMat('soldierSwordGuard', '#475569', 0.5, 0.4);
            const guard = new THREE.Mesh(guardGeom, guardMat);
            swordGroup.add(guard);
            const handleGeom = new THREE.CylinderGeometry(0.08 * sf, 0.08 * sf, 0.4 * sf, 6);
            const handleMat = getCachedMat('soldierSwordHandle', '#1E293B', 0.1, 0.8);
            const handle = new THREE.Mesh(handleGeom, handleMat);
            handle.position.y = -0.2 * sf;
            swordGroup.add(handle);
            swordGroup.position.set(1.1 * sf, 0, 0.6 * sf);
            swordGroup.rotation.set(0.2, 0, -0.3);
            body.add(swordGroup);
            swordMesh = swordGroup;

        } else if (skin.type === 'death_knight') {
            // Death Knight: Black armored body, dark visor, shoulder plates, power axe
            const armorMat = getCachedMat('dkArmor', '#1a1a2e', 0.9, 0.1);
            armorMat.emissive = new THREE.Color('#3B0000');
            armorMat.emissiveIntensity = 0.3;
            const geomBody = isGiant ? this.geomBodyGiant : this.geomBodyNormal;
            const body = new THREE.Mesh(geomBody, armorMat);
            body.position.y = isGiant ? 4.5 : 2.2;
            unitGroup.add(body);
            mainMesh = body;

            // Dark visor (red glow)
            const visorMat = getCachedMat('dkVisor', '#8B0000', 0.1, 0.05);
            visorMat.emissive = new THREE.Color('#FF0000');
            visorMat.emissiveIntensity = 0.6;
            const visor = new THREE.Mesh(new THREE.BoxGeometry(1.0 * sf, 0.25 * sf, 0.4 * sf), visorMat);
            visor.position.set(0, isGiant ? 1.5 : 0.8, isGiant ? 2.1 : 0.95);
            body.add(visor);

            // Shoulder armor plates
            const shoulderMat = getCachedMat('dkShoulder', '#111122', 0.9, 0.1);
            const shoulderGeom = new THREE.BoxGeometry(0.6 * sf, 0.4 * sf, 0.6 * sf);
            const shL = new THREE.Mesh(shoulderGeom, shoulderMat);
            shL.position.set(-1.0 * sf, isGiant ? 1.0 : 0.5, 0);
            body.add(shL);
            const shR = new THREE.Mesh(shoulderGeom, shoulderMat);
            shR.position.set(1.0 * sf, isGiant ? 1.0 : 0.5, 0);
            body.add(shR);

            // Death Axe
            const axeGroup = new THREE.Group();
            const axeHandleMat = getCachedMat('dkAxeHandle', '#2D1B00', 0.2, 0.8);
            const axeHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * sf, 0.1 * sf, 2.0 * sf, 6), axeHandleMat);
            axeHandle.position.y = 1.0 * sf;
            axeGroup.add(axeHandle);
            const axeHeadMat = getCachedMat('dkAxeHead', '#8B0000', 0.9, 0.1);
            axeHeadMat.emissive = new THREE.Color('#FF2200');
            axeHeadMat.emissiveIntensity = 0.5;
            const axeHead = new THREE.Mesh(new THREE.ConeGeometry(0.7 * sf, 1.0 * sf, 4), axeHeadMat);
            axeHead.position.y = 2.1 * sf;
            axeHead.rotation.z = Math.PI / 4;
            axeGroup.add(axeHead);
            axeGroup.position.set(1.2 * sf, -0.4 * sf, 0.4 * sf);
            axeGroup.rotation.z = 0.4;
            body.add(axeGroup);
            swordMesh = axeGroup;

        } else if (skin.type === 'thunder_god') {
            // Thunder God: Cobalt blue muscular body, gold lightning horns, wings, crackling hammer
            const godMat = getCachedMat('tgBody', '#1a3a6e', 0.6, 0.2);
            godMat.emissive = new THREE.Color('#002244');
            godMat.emissiveIntensity = 0.4;
            const geomBody = isGiant ? this.geomBodyGiant : this.geomBodyNormal;
            const body = new THREE.Mesh(geomBody, godMat);
            body.position.y = isGiant ? 4.5 : 2.2;
            unitGroup.add(body);
            mainMesh = body;

            // Gold lightning horns
            const hornMat = getCachedMat('tgHorn', '#FFD700', 0.9, 0.05);
            hornMat.emissive = new THREE.Color('#FFD700');
            hornMat.emissiveIntensity = 0.5;
            const hornGeom = new THREE.ConeGeometry(0.2 * sf, 0.9 * sf, 4);
            const hornL = new THREE.Mesh(hornGeom, hornMat);
            hornL.position.set(-0.55 * sf, isGiant ? 2.8 : 1.5, 0.2 * sf);
            hornL.rotation.set(-0.3, 0, -0.5);
            body.add(hornL);
            const hornR = new THREE.Mesh(hornGeom, hornMat);
            hornR.position.set(0.55 * sf, isGiant ? 2.8 : 1.5, 0.2 * sf);
            hornR.rotation.set(-0.3, 0, 0.5);
            body.add(hornR);

            // Wings (dark blue triangular panels)
            const wingMat = getCachedMat('tgWing', '#0d1f42', 0.5, 0.4);
            const wingGeom = new THREE.BoxGeometry(1.8 * sf, 1.2 * sf, 0.08 * sf);
            const wingL = new THREE.Mesh(wingGeom, wingMat);
            wingL.position.set(-1.5 * sf, isGiant ? 0.6 : 0.3, -0.5 * sf);
            wingL.rotation.set(0.3, -0.3, -0.15);
            body.add(wingL);
            const wingR = new THREE.Mesh(wingGeom, wingMat);
            wingR.position.set(1.5 * sf, isGiant ? 0.6 : 0.3, -0.5 * sf);
            wingR.rotation.set(0.3, 0.3, 0.15);
            body.add(wingR);

            // Eyes (lightning yellow)
            const eyeMat = getCachedMat('tgEyes', '#FFD700', 0.0, 0.2);
            eyeMat.emissive = new THREE.Color('#FFAA00');
            eyeMat.emissiveIntensity = 0.8;
            const eyeL = new THREE.Mesh(new THREE.SphereGeometry(isGiant ? 0.35 : 0.2, 8, 8), eyeMat);
            eyeL.position.set(-0.35 * sf, isGiant ? 1.5 : 0.8, isGiant ? 2.2 : 1.0);
            body.add(eyeL);
            const eyeR = new THREE.Mesh(new THREE.SphereGeometry(isGiant ? 0.35 : 0.2, 8, 8), eyeMat);
            eyeR.position.set(0.35 * sf, isGiant ? 1.5 : 0.8, isGiant ? 2.2 : 1.0);
            body.add(eyeR);

            // Thunder Hammer
            const hammerGroup = new THREE.Group();
            const hamMat = getCachedMat('tgHammer', '#4a7ab5', 0.85, 0.15);
            const hamHead = new THREE.Mesh(new THREE.BoxGeometry(1.0 * sf, 0.7 * sf, 0.7 * sf), hamMat);
            hamHead.position.y = 1.6 * sf;
            hammerGroup.add(hamHead);
            const hamHandleMat = getCachedMat('tgHamHandle', '#2a4a7a', 0.4, 0.6);
            const hamHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * sf, 0.1 * sf, 1.5 * sf, 6), hamHandleMat);
            hamHandle.position.y = 0.75 * sf;
            hammerGroup.add(hamHandle);
            // Lightning rune on hammer head
            const runeMat = getCachedMat('tgRune', '#FFD700', 0.0, 0.1);
            runeMat.emissive = new THREE.Color('#FFD700');
            runeMat.emissiveIntensity = 1.0;
            const rune = new THREE.Mesh(new THREE.BoxGeometry(0.25 * sf, 0.6 * sf, 0.08 * sf), runeMat);
            rune.position.set(0, 0, 0.36 * sf);
            hamHead.add(rune);
            hammerGroup.position.set(1.3 * sf, -0.5 * sf, 0.5 * sf);
            hammerGroup.rotation.set(0.2, 0, -0.4);
            body.add(hammerGroup);
            swordMesh = hammerGroup;

        } else if (skin.type === 'void_reaper') {
            // Void Reaper: Pitch-black ethereal body, flowing dark cloak, glowing purple scythe
            const voidMat = getCachedMat('vrBody', '#0d0015', 0.2, 0.8);
            voidMat.emissive = new THREE.Color('#2d0050');
            voidMat.emissiveIntensity = 0.4;
            const geomBody = isGiant ? this.geomBodyGiant : this.geomBodyNormal;
            const body = new THREE.Mesh(geomBody, voidMat);
            body.position.y = isGiant ? 4.5 : 2.2;
            unitGroup.add(body);
            mainMesh = body;

            // Flowing dark cloak (two wide angled panels)
            const cloakMat = getCachedMat('vrCloak', '#0a001a', 0.1, 0.9);
            const cloakL = new THREE.Mesh(new THREE.BoxGeometry(0.9 * sf, 2.2 * sf, 0.08 * sf), cloakMat);
            cloakL.position.set(-0.6 * sf, isGiant ? 0.2 : 0.0, -0.9 * sf);
            cloakL.rotation.set(0.2, -0.2, 0.1);
            body.add(cloakL);
            const cloakR = new THREE.Mesh(new THREE.BoxGeometry(0.9 * sf, 2.2 * sf, 0.08 * sf), cloakMat);
            cloakR.position.set(0.6 * sf, isGiant ? 0.2 : 0.0, -0.9 * sf);
            cloakR.rotation.set(0.2, 0.2, -0.1);
            body.add(cloakR);

            // Void hood (dark hemisphere)
            const hoodMat = getCachedMat('vrHood', '#050010', 0.1, 0.9);
            const hood = new THREE.Mesh(new THREE.SphereGeometry(0.8 * sf, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), hoodMat);
            hood.position.set(0, isGiant ? 2.6 : 1.3, 0);
            hood.rotation.x = 0.4;
            body.add(hood);

            // Glowing void eyes (purple)
            const eyeMat = getCachedMat('vrEyes', '#9400D3', 0.0, 0.1);
            eyeMat.emissive = new THREE.Color('#DD00FF');
            eyeMat.emissiveIntensity = 1.0;
            const eyeL = new THREE.Mesh(new THREE.SphereGeometry(isGiant ? 0.35 : 0.2, 8, 8), eyeMat);
            eyeL.position.set(-0.35 * sf, isGiant ? 1.5 : 0.8, isGiant ? 2.2 : 1.0);
            body.add(eyeL);
            const eyeR = new THREE.Mesh(new THREE.SphereGeometry(isGiant ? 0.35 : 0.2, 8, 8), eyeMat);
            eyeR.position.set(0.35 * sf, isGiant ? 1.5 : 0.8, isGiant ? 2.2 : 1.0);
            body.add(eyeR);

            // Cosmic Scythe
            const scytheGroup = new THREE.Group();
            const poleHandleMat = getCachedMat('vrPole', '#1a0030', 0.3, 0.7);
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * sf, 0.08 * sf, 2.4 * sf, 6), poleHandleMat);
            pole.position.y = 1.2 * sf;
            scytheGroup.add(pole);
            const bladeMat2 = getCachedMat('vrScytheBlade', '#5500AA', 0.1, 0.1);
            bladeMat2.emissive = new THREE.Color('#CC00FF');
            bladeMat2.emissiveIntensity = 0.8;
            // Curved scythe blade (approximated as rotated box)
            const scBlade = new THREE.Mesh(new THREE.BoxGeometry(1.5 * sf, 0.15 * sf, 0.08 * sf), bladeMat2);
            scBlade.position.set(0.5 * sf, 2.3 * sf, 0);
            scBlade.rotation.z = -0.7;
            scytheGroup.add(scBlade);
            const scTip = new THREE.Mesh(new THREE.ConeGeometry(0.18 * sf, 0.5 * sf, 4), bladeMat2);
            scTip.position.set(1.1 * sf, 1.8 * sf, 0);
            scTip.rotation.z = -1.2;
            scytheGroup.add(scTip);
            scytheGroup.position.set(-1.2 * sf, -0.5 * sf, 0.4 * sf);
            scytheGroup.rotation.z = -0.3;
            body.add(scytheGroup);
            swordMesh = scytheGroup;

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
        
        unitGroup.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

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
            rainbowMat: rainbowMat,
            sword: swordMesh
        };
    }

    addUnits(n, type = 'normal') {
        this.count += n;
        const toAdd = Math.min(n, 150 - this.units.filter(u => u.alive).length);
        for (let i = 0; i < toAdd; i++) this.units.push(this._makeUnit(true, type));
    }

    removeUnits(n) {
        let removed = 0;
        
        // First pass: try to remove 'normal' units
        for (let i = this.units.length - 1; i >= 0 && removed < n; i--) {
            if (this.units[i].alive && this.units[i].type !== 'giant') {
                const u = this.units[i];
                u.alive = false;
                u.targetScale = 0;
                // Death burst: fly right (crowd side)
                u.deathVx = Utils.randomRange(5, 20);
                u.deathVz = Utils.randomRange(-10, 10);
                u.deathVy = Utils.randomRange(8, 18);
                u.deathSpin = Utils.randomRange(-8, 8);
                removed++;
            }
        }
        
        // Second pass: if we STILL need to remove units, remove giants
        for (let i = this.units.length - 1; i >= 0 && removed < n; i--) {
            if (this.units[i].alive) {
                const u = this.units[i];
                u.alive = false;
                u.targetScale = 0;
                // Death burst: fly right (crowd side)
                u.deathVx = Utils.randomRange(5, 20);
                u.deathVz = Utils.randomRange(-10, 10);
                u.deathVy = Utils.randomRange(8, 18);
                u.deathSpin = Utils.randomRange(-8, 8);
                removed++;
            }
        }
        
        this.count = Math.max(0, this.count - n);
    }

    applyGate(type, value) {
        let nc = this.count;
        let prefix = '';
        let color = '';
        switch (type) {
            case 'multiply': nc = Math.floor(nc * value); prefix = '×'; color = '#00FF00'; break;
            case 'add': nc = nc + value; prefix = '+'; color = '#00FF00'; break;
            case 'divide': nc = Math.max(0, Math.floor(nc / value)); prefix = '÷'; color = '#FF0000'; break;
            case 'subtract': nc = Math.max(0, nc - value); prefix = '-'; color = '#FF0000'; break;
        }
        nc = Math.max(0, nc);
        const diff = nc - this.count;
        
        const cx = GC.W / 2;
        const cy = GC.H / 2 - 50;

        if (diff > 0) {
            this.addUnits(diff);
            if (this.game && this.game.floatingText) {
                this.game.floatingText.spawn(prefix + value, cx, cy, color, 40);
                this.game.particles.neonRing(cx, cy, color);
            }
        }
        else if (diff < 0) {
            this.removeUnits(-diff);
            if (this.game && this.game.floatingText) {
                this.game.floatingText.spawn(prefix + value, cx, cy, color, 40);
                this.game.screenFx.shake(6, 0.2);
            }
        }
    }

    clashRemoveAmount(amount) {
        if (amount <= 0 || this.count <= 0) return 0;
        
        let removed = 0;
        let damage = 0;
        
        let visualRemoves = Math.min(amount, 3);
        
        for (let i = this.units.length - 1; i >= 0 && visualRemoves > 0; i--) {
            const u = this.units[i];
            if (u.alive) {
                if (u.type === 'giant') {
                    u.hp--;
                    if (u.hp <= 0) {
                        u.alive = false;
                        u.targetScale = 0;
                        // Death burst: fly right
                        u.deathVx = Utils.randomRange(8, 25);
                        u.deathVz = Utils.randomRange(-12, 12);
                        u.deathVy = Utils.randomRange(10, 22);
                        u.deathSpin = Utils.randomRange(-6, 6);
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
                    // Death burst: fly forward toward camera
                    u.deathVx = Utils.randomRange(-8, 8);
                    u.deathVz = Utils.randomRange(10, 25);
                    u.deathVy = Utils.randomRange(8, 16);
                    u.deathSpin = Utils.randomRange(-8, 8);
                    this.count = Math.max(0, this.count - 1);
                    visualRemoves--;
                    removed++;
                    damage += 1;
                }
            }
        }
        
        if (removed > 0 && this.game && this.game.floatingText) {
            const cx = GC.W / 2 + Utils.randomRange(-30, 30);
            const cy = GC.H / 2 - 20 + Utils.randomRange(-30, 30);
            this.game.floatingText.spawn('-' + removed, cx, cy, '#FF3333', 30);
            this.game.screenFx.shake(5, 0.2);
            this.game.particles.clashSparks(cx, cy, 10);
        }
        
        const remainingToRemove = Math.min(amount - removed, this.count);
        if (remainingToRemove > 0) {
            let markedDead = 0;
            for (let i = this.units.length - 1; i >= 0 && markedDead < remainingToRemove; i--) {
                const u = this.units[i];
                if (u.alive) {
                    u.alive = false;
                    u.targetScale = 0;
                    markedDead++;
                }
            }
            this.count -= remainingToRemove;
            damage += remainingToRemove;
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
                
                // Spread out based on count, clamp so it doesn't get ridiculously large
                const spreadScale = Math.min(1 + Math.sqrt(Math.min(this.count, 2000)) * 0.05, 1.8);
                let tx = u.ox * spreadScale;
                let tz = u.oz * spreadScale;
                
                let sxFactor = 1.0;
                let syFactor = 1.0;
                let szFactor = 1.0;

                if (this.game.state === 'RESULTS' || (this.game.fortress && this.game.fortress.state === 'destroyed')) {
                    // Happy victory celebration animation!
                    tx = u.ox * spreadScale;
                    tz = u.oz * spreadScale;

                    u.mesh.position.y = Math.abs(Math.sin(u.phase * 3.5)) * 4.5;
                    u.mesh.rotation.y += dt * 7.0; // spin quickly
                    syFactor = 1.25 + Math.sin(u.phase * 4) * 0.15;
                    sxFactor = 0.85 - Math.sin(u.phase * 4) * 0.1;
                    szFactor = 0.85 - Math.sin(u.phase * 4) * 0.1;
                    u.targetScale = 1.1;

                    // Raise swords high in victory!
                    if (u.sword) {
                        u.sword.rotation.x = Utils.lerp(u.sword.rotation.x, -1.4 + Math.sin(u.phase * 4.0) * 0.15, 0.2);
                        u.sword.rotation.z = Utils.lerp(u.sword.rotation.z, 0, 0.2);
                    }

                    // Combine into Prince animation!
                    const isLastLevel = this.game.currentLevel && this.game.currentLevel.id === 20;
                    
                    if (isLastLevel) {
                        if (i === 0) {
                            // The primary unit becomes the Prince
                            if (u.type !== 'prince') {
                                // Extract a new Prince mesh and replace the current one
                                const newPrince = this._makeUnit(false, 'prince');
                                this.group.remove(u.mesh);
                                u.mesh = newPrince.mesh;
                                u.sword = newPrince.sword;
                                u.type = 'prince';
                                // Note: newPrince.mesh already has shadows enabled via _makeUnit and is added to group
                                // We should remove the one _makeUnit just added to avoid duplicates, but u.mesh is already the new one
                                // Actually, _makeUnit adds to this.group. So we just let it be and remove the old one.
                            }
                            
                            tx = 0;
                            tz = -5.0; 
                            u.mesh.position.y = Math.abs(Math.sin(u.phase * 2.0)) * 2; // jump happily
                            u.mesh.rotation.y = Math.PI; // Face the Princess
                            u.targetScale = 1.8; // Grow into a larger hero
                            
                            if (u.sword) {
                                // Prince salutes Princess with sword
                                u.sword.rotation.x = Utils.lerp(u.sword.rotation.x, -1.0, 0.2);
                                u.sword.rotation.z = Utils.lerp(u.sword.rotation.z, -0.5, 0.2);
                            }
                        } else {
                            // All other units fly into the Prince (tx=0, tz=-5) and shrink to 0
                            tx = 0;
                            tz = -5.0;
                            u.targetScale = 0;
                            
                            u.mesh.position.y = Math.abs(Math.sin(u.phase * 3.5)) * 4.5;
                            u.mesh.rotation.y += dt * 7.0; // spin quickly while merging
                            syFactor = 1.25 + Math.sin(u.phase * 4) * 0.15;
                            sxFactor = 0.85 - Math.sin(u.phase * 4) * 0.1;
                            szFactor = 0.85 - Math.sin(u.phase * 4) * 0.1;
                        }
                    }
                } else if (!moving) {
                    if (u.ringAngle === undefined) {
                        // Spacing based on index to form a clean line-by-line chain
                        u.ringAngle = i * 0.15;
                    }
                    u.ringAngle += dt * 1.5; // smooth slow rotation speed
                    
                    const t = u.ringAngle;
                    
                    // Unique round fighting style: Crowd surrounds the enemy!
                    // The enemy is at local Z = -3.75
                    const orbitRadius = 4.0 + (i % 3) * 1.8; // Concentric rings
                    
                    tx = Math.cos(t) * orbitRadius;
                    tz = Math.sin(t) * orbitRadius - 3.75; // Offset to center on enemy
                    
                    // Flat on the ground (no up-down animation when clashing)
                    u.mesh.position.y = u.type === 'giant' ? 4.5 : 2.2;
                    
                    const attacking = true; // Always attacking in the circle
                    u.targetScale = attacking ? 1.25 : 1.0;
                    
                    if (attacking) {
                        // Stretch: taller body, thinner radius
                        syFactor = 1.25;
                        sxFactor = 0.85;
                        szFactor = 0.85;
                        
                        // Lean forward towards the enemy and swing sword!
                        u.mesh.rotation.x = Utils.lerp(u.mesh.rotation.x || 0, 0.45, 0.2);
                        if (u.sword) {
                            u.sword.rotation.x = Utils.lerp(u.sword.rotation.x, -1.0 + Math.sin(u.phase * 8.0) * 1.0, 0.35);
                            u.sword.rotation.z = Utils.lerp(u.sword.rotation.z, -0.6 + Math.sin(u.phase * 4.0) * 0.2, 0.35);
                        }
                    } else {
                        // Squash when returning/landing
                        syFactor = 0.85;
                        sxFactor = 1.15;
                        szFactor = 1.15;
                        u.mesh.rotation.x = Utils.lerp(u.mesh.rotation.x || 0, 0, 0.2);
                        if (u.sword) {
                            u.sword.rotation.x = Utils.lerp(u.sword.rotation.x, 0.2, 0.25);
                            u.sword.rotation.z = Utils.lerp(u.sword.rotation.z, -0.3, 0.25);
                        }
                    }
                    
                    // Face the enemy in the center
                    const dx = -Math.cos(t);
                    const dz = -Math.sin(t);
                    const targetRotY = Math.atan2(dx, dz);
                    const rotLerp = 1 - Math.pow(1 - 0.18, dt * 60);
                    u.mesh.rotation.y = Utils.lerp(u.mesh.rotation.y || 0, targetRotY, rotLerp);
                } else {
                    u.mesh.position.y = Math.abs(Math.sin(u.phase)) * 2;
                    if (u.ringAngle !== undefined) u.ringAngle = undefined;
                    u.targetScale = 1.0;
                    const rotLerp = 1 - Math.pow(1 - 0.10, dt * 60);
                    u.mesh.rotation.x = Utils.lerp(u.mesh.rotation.x || 0, 0, rotLerp);
                    u.mesh.rotation.y = Utils.lerp(u.mesh.rotation.y || 0, 0, rotLerp);
                    
                    // Sway sword slightly while walking/running
                    if (u.sword) {
                        u.sword.rotation.x = Utils.lerp(u.sword.rotation.x, 0.2 + Math.sin(u.phase) * 0.15, 0.2);
                        u.sword.rotation.z = Utils.lerp(u.sword.rotation.z, -0.3 + Math.cos(u.phase) * 0.05, 0.2);
                    }
                }
                
                const posLerp = 1 - Math.pow(1 - 0.18, dt * 60);
                const scaleLerp = 1 - Math.pow(1 - 0.15, dt * 60);
                
                u.mesh.position.x = Utils.lerp(u.mesh.position.x, tx, posLerp);
                u.mesh.position.z = Utils.lerp(u.mesh.position.z, tz, posLerp);
                
                u.scale = Utils.lerp(u.scale, u.targetScale, scaleLerp);
                u.mesh.scale.set(u.scale * sxFactor, u.scale * syFactor, u.scale * szFactor);
            } else {
                // Death burst: fly outward to the right
                if (u.deathVx !== undefined) {
                    u.mesh.position.x += u.deathVx * dt;
                    u.mesh.position.z += u.deathVz * dt;
                    u.mesh.position.y += u.deathVy * dt;
                    u.deathVy -= 30 * dt; // gravity
                    u.deathVx *= Math.pow(0.85, dt * 60);
                    u.deathVz *= Math.pow(0.85, dt * 60);
                    u.mesh.rotation.z += u.deathSpin * dt;
                }
                
                const scaleLerp = 1 - Math.pow(1 - 0.15, dt * 60);
                u.scale = Utils.lerp(u.scale, u.targetScale, scaleLerp);
                u.mesh.scale.set(u.scale, u.scale, u.scale);
            }
            
            if (!u.alive && u.scale < 0.01) {
                u.mesh.visible = false;
            } else {
                u.mesh.visible = true;
            }
        }
    }
}
