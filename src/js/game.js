// ============================================================
// game.js — Main game loop using Three.js for WebGL 3D rendering
// ============================================================

class Game {
    constructor(canvas, uiCanvas) {
        this.canvas = canvas;
        this.uiCanvas = uiCanvas;
        this.uiCtx = uiCanvas.getContext('2d');
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);

        // --- Three.js Setup ---
        this.scene = new THREE.Scene();

        // Fog setup (Dynamic, updated in loop)
        this.scene.fog = new THREE.FogExp2(0x2B2F36, 0.0025);
        
        // Isometric-ish Camera
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 3000);
        this.camera.position.set(0, 80, 100);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setClearColor(0x2B2F36); // Dark grey background
        
        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.6); // Enhanced ambient
        this.scene.add(ambient);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8); // Enhanced directional
        dirLight.position.set(-50, 100, 50);
        this.scene.add(dirLight);

        // Neon ambient glow
        const blueGlow = new THREE.PointLight(0x00B4FF, 1.5, 200);
        blueGlow.position.set(0, 50, 0);
        this.scene.add(blueGlow);

        this._initEnvironment();

        // --- Game Logic State ---
        this.state = 'MENU'; // MENU, PLAYING, CLASH, FORTRESS_ATTACK, RESULTS, GAME_OVER
        this.settings = { sensitivity: 1.0, soundEnabled: true, graphicsQuality: 'high' };

        // Fever / Hyper Rush system
        this.feverGauge = 0;
        this.feverActive = false;
        this.feverTimer = 0;

        this.sound = new SoundManager();
        this.shop = new Shop();
        this.particles = new ParticleSystem(800);
        this.floatingText = new FloatingTextManager();
        this.screenFx = new ScreenFX();
        this.combo = new ComboSystem(this);
        this.crowd = new Crowd(this);
        this.gates = new GateManager(this);
        this.obstacles = new ObstacleManager(this);
        this.enemies = new EnemyManager(this);
        this.fortress = new Fortress(this);
        this.ui = new UI(this);

        this.resize();

        this.currentLevel = null;
        this.lastTime = 0;
        
        // Ad System Mock
        this.adPlaying = false;
        this.adTimer = 0;
        this.adRewardCallback = null;

        this.setupInput();
        window.addEventListener('resize', () => this.resize());
        if (typeof Android !== 'undefined' && Android.showBanner) {
            try { Android.showBanner(); } catch(e) {}
        }
    }

    _initEnvironment() {
        // Create the smooth asphalt road
        const roadGeom = new THREE.PlaneGeometry(120, 2000);
        const roadMat = new THREE.MeshStandardMaterial({ 
            color: 0x454548, // Flat grey road
            roughness: 1.0,
            metalness: 0.0
        });
        this.roadMesh = new THREE.Mesh(roadGeom, roadMat);
        this.roadMesh.rotation.x = -Math.PI / 2;
        this.roadMesh.position.z = -800; // Extend deep into the screen
        this.scene.add(this.roadMesh);

        // Center dashed yellow line
        this.arrowsGroup = new THREE.Group();
        const lineGeom = new THREE.PlaneGeometry(2, 16);
        const lineMat = new THREE.MeshBasicMaterial({ 
            color: 0xFFC800, 
            transparent: true, 
            opacity: 0.6,
            depthWrite: false
        });
        
        for (let i = 0; i < 50; i++) {
            const line = new THREE.Mesh(lineGeom, lineMat);
            line.rotation.x = -Math.PI / 2;
            line.position.set(0, 0.2, -i * 40);
            this.arrowsGroup.add(line);
        }
        this.scene.add(this.arrowsGroup);

        // Side Blocks (Simple dark grey walls)
        this.pillarsGroup = new THREE.Group();
        const blockGeom = new THREE.BoxGeometry(8, 6, 20);
        const blockMat = new THREE.MeshStandardMaterial({ color: 0x1A1C20 }); // Dark block

        for (let i = 0; i < 40; i++) {
            for (const side of [-1, 1]) {
                const block = new THREE.Mesh(blockGeom, blockMat);
                block.position.set(side * 64, 3, -i * 50);
                this.pillarsGroup.add(block);
            }
        }
        this.scene.add(this.pillarsGroup);

        // Distant Cityscape Silhouettes (Flat 2D style)
        this.cityGroup = new THREE.Group();
        const bldgMat = new THREE.MeshBasicMaterial({ color: 0x1C1F26 }); // Darker than sky

        for (let i = 0; i < 40; i++) {
            const w = Math.random() * 60 + 30;
            const h = Math.random() * 150 + 80;
            const d = 10;
            
            const geom = new THREE.BoxGeometry(w, h, d);
            const mesh = new THREE.Mesh(geom, bldgMat);
            
            // Position in distance, arranged flatly
            mesh.position.x = (Math.random() - 0.5) * 800;
            mesh.position.y = h / 2 - 20;
            mesh.position.z = -1200;
            
            this.cityGroup.add(mesh);
        }
        this.scene.add(this.cityGroup);
        
        // Optimization: Freeze matrix auto-update for static background structures
        this.pillarsGroup.children.forEach(p => { p.matrixAutoUpdate = false; p.updateMatrix(); });
        this.cityGroup.children.forEach(b => { b.matrixAutoUpdate = false; b.updateMatrix(); });
        this.arrowsGroup.children.forEach(l => { l.matrixAutoUpdate = false; l.updateMatrix(); });

        // Initial Theme apply
        this._applyTheme('city');
    }
    
    _applyTheme(theme) {
        if (theme === 'meadow') {
            this.renderer.setClearColor(0x87CEEB);
            this.scene.fog.color.setHex(0x87CEEB);
            this.roadMesh.material.color.setHex(0x768876);
            
            this.pillarsGroup.children.forEach(p => p.material.color.setHex(0x33AA33)); // Green grass blocks
            this.cityGroup.children.forEach(b => {
                b.material.color.setHex(0x228B22); // Forest/Trees
                b.scale.set(1, 0.6, 1); // Shorter, rounder
            });
            this.scene.children.forEach(c => {
                if(c.isPointLight) c.color.setHex(0xFFFFFF); // White ambient daylight
            });
        } else if (theme === 'desert') {
            this.renderer.setClearColor(0xFFB454);
            this.scene.fog.color.setHex(0xFFB454);
            this.roadMesh.material.color.setHex(0xD2B48C);
            
            this.pillarsGroup.children.forEach(p => p.material.color.setHex(0xCC5500)); // Orange rocks
            this.cityGroup.children.forEach(b => {
                b.material.color.setHex(0xAA4400); // Canyon silhouettes
                b.scale.set(1, 1.2, 1); // Taller cliffs
            });
            this.scene.children.forEach(c => {
                if(c.isPointLight) c.color.setHex(0xFFBB44); // Warm ambient sun
            });
        } else if (theme === 'volcano') {
            this.renderer.setClearColor(0x1A0A00);
            this.scene.fog.color.setHex(0x1A0A00);
            this.roadMesh.material.color.setHex(0x3A180E);
            
            this.pillarsGroup.children.forEach(p => p.material.color.setHex(0x8B1A00)); // Dark red pillars
            this.cityGroup.children.forEach(b => {
                b.material.color.setHex(0x180500); // Volcanic mountains
                b.scale.set(1, 1.4, 1); // Taller, jagged peaks
            });
            this.scene.children.forEach(c => {
                if(c.isPointLight) c.color.setHex(0xFF4400); // Orange-red magma glow
            });
        } else {
            // City / Default
            this.renderer.setClearColor(0x2B2F36);
            this.scene.fog.color.setHex(0x2B2F36);
            this.roadMesh.material.color.setHex(0x454548);
            
            this.pillarsGroup.children.forEach(p => p.material.color.setHex(0x1A1C20)); // Concrete blocks
            this.cityGroup.children.forEach(b => {
                b.material.color.setHex(0x1C1F26); // Dark buildings
                b.scale.set(1, 1, 1);
            });
            this.scene.children.forEach(c => {
                if(c.isPointLight) c.color.setHex(0x00B4FF); // Blue neon glow
            });
        }
        
        // Propagate theme to Player and UI
        if (this.crowd && typeof this.crowd._applyTheme === 'function') {
            this.crowd._applyTheme(theme);
        }
        if (this.ui && typeof this.ui._applyTheme === 'function') {
            this.ui._applyTheme(theme);
        }
    }

    resize() {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        
        const aspect = GC.W / GC.H;
        let w, h;
        if (screenW / screenH > aspect) { h = screenH; w = h * aspect; }
        else { w = screenW; h = w / aspect; }

        const left = (screenW - w) / 2;
        const top = (screenH - h) / 2;

        // Size and position 3D WebGL Canvas
        this.renderer.setSize(w * this.dpr, h * this.dpr, false);
        this.canvas.style.width = `${w}px`;
        this.canvas.style.height = `${h}px`;
        this.canvas.style.left = `${left}px`;
        this.canvas.style.top = `${top}px`;

        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();

        // Size and position 2D UI Canvas
        this.uiCanvas.style.width = `${w}px`;
        this.uiCanvas.style.height = `${h}px`;
        this.uiCanvas.style.left = `${left}px`;
        this.uiCanvas.style.top = `${top}px`;

        this.uiCanvas.width = GC.W * this.dpr;
        this.uiCanvas.height = GC.H * this.dpr;
        this.uiCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.uiCanvasRect = null; // invalidate cached rect
    }

    _getPos(e) {
        if (!this.uiCanvasRect) this.uiCanvasRect = this.uiCanvas.getBoundingClientRect();
        const rect = this.uiCanvasRect;
        const touch = e.touches ? e.touches[0] : e;
        if (!touch) return null;
        
        // Map pointer to 2D UI coordinates (0-GC.W, 0-GC.H)
        return {
            x: (touch.clientX - rect.left) / rect.width * GC.W,
            y: (touch.clientY - rect.top) / rect.height * GC.H,
        };
    }

    setupInput() {
        let pointerDown = false;

        const onDown = (e) => {
            e.preventDefault();
            if (this.sound && this.sound._ctx && this.sound._ctx.state === 'suspended') {
                this.sound._ctx.resume();
            }
            this.uiCanvasRect = this.uiCanvas.getBoundingClientRect();
            const pos = this._getPos(e);
            if (!pos) return;
            pointerDown = true;

            // UI clicks first
            if (this.state === 'MENU' || this.state === 'GAME_OVER' || this.state === 'RESULTS') {
                if (this.ui.handleClick(pos.x, pos.y)) return;
            }
            
            // Exit button check
            if (this.state === 'PLAYING' || this.state === 'CLASH' || this.state === 'FORTRESS_ATTACK') {
                if (this.ui.handleClick(pos.x, pos.y)) return; 
                this.dragStartX = pos.x;
                this.dragStartLaneX = this.crowd.targetLaneX || 0;
            }
        };

        const onMove = (e) => {
            e.preventDefault();
            if (!pointerDown) return;
            const pos = this._getPos(e);
            if (!pos) return;

            if (this.state === 'PLAYING' || this.state === 'CLASH' || this.state === 'FORTRESS_ATTACK') {
                const dx = pos.x - this.dragStartX;
                const sensitivity = (2.0 / (GC.W * 0.7)) * (this.settings ? this.settings.sensitivity : 1.0);
                const target = this.dragStartLaneX + dx * sensitivity;
                this.crowd.targetLaneX = Utils.clamp(target, -1.0, 1.0);
            }
        };

        const onUp = (e) => {
            e.preventDefault();
            pointerDown = false;
        };

        // Attach listeners to the window so drag works across entire screen
        window.addEventListener('mousedown', onDown, { passive: false });
        window.addEventListener('mousemove', onMove, { passive: false });
        window.addEventListener('mouseup', onUp);
        window.addEventListener('mouseleave', onUp);
        window.addEventListener('touchstart', onDown, { passive: false });
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onUp, { passive: false });
        window.addEventListener('touchcancel', onUp, { passive: false });

        window.addEventListener('scroll', () => { this.uiCanvasRect = null; });
    }

    addFever(amount) {
        if (this.feverActive) return;
        this.feverGauge = Math.min(GC.FEVER_MAX, this.feverGauge + amount);
        if (this.feverGauge >= GC.FEVER_MAX) {
            this.triggerFever();
        }
    }

    triggerFever() {
        this.feverActive = true;
        this.feverTimer = this.shop.getFeverDuration();
        this.feverGauge = GC.FEVER_MAX;
        
        this.screenFx.flash('rgba(0,255,255,0.7)', 0.6);
        this.screenFx.shake(12, 0.6);
        if (this.sound) this.sound.feverRush();
        
        // Spawn Floating Callout Text
        const cx = GC.W / 2;
        const cy = GC.H / 3;
        this.floatingText.spawn('⚡ HYPER RUSH! ⚡', cx, cy, '#00FFFF', 48);
        this.particles.confetti(cx, cy, 80);
    }

    startLevel(num) {
        const idx = num - 1;
        if (idx < 0 || idx >= LEVELS.length) return;
        if (typeof Android !== 'undefined' && Android.hideBanner) {
            try { Android.hideBanner(); } catch(e) {}
        }
        this.currentLevel = LEVELS[idx];
        this.state = 'PLAYING';
        this.ui.showingShop = false;
        this.ui.resultData = null;
        this.ui.showingWorldMap = false;
        this.ui.showingSettings = false;

        this.feverGauge = 0;
        this.feverActive = false;
        this.feverTimer = 0;

        const startCount = this.shop.getStartingCrowd();
        this.crowd.init(startCount, this.shop.getCurrentSkin());
        this.gates.init(this.currentLevel);
        this.obstacles.init(this.currentLevel);
        this.enemies.init(this.currentLevel);
        this.fortress.init(this.currentLevel);
        this.combo.reset();
        
        // Apply world theme
        if (this.currentLevel.theme) {
            this._applyTheme(this.currentLevel.theme);
        }
        
        // Reset camera position
        this.camera.position.set(0, 80, 100);
    }

    revive() {
        if (this.state !== 'GAME_OVER') return;
        const rc = Math.max(5, Math.floor((this.crowd.displayCount || 10) * 0.5));
        this.crowd.init(rc, this.shop.getCurrentSkin());
        if (typeof Android !== 'undefined' && Android.hideBanner) {
            try { Android.hideBanner(); } catch(e) {}
        }
        this.state = 'PLAYING';
    }

    goToMenu() {
        this.state = 'MENU';
        this.currentLevel = null;
        this.ui.showingShop = false;
        if (typeof Android !== 'undefined' && Android.showBanner) {
            try { Android.showBanner(); } catch(e) {}
        }
    }

    showResults() {
        const coins = this.fortress.coinsEarned;
        this.shop.addCoins(coins);
        this.shop.completeLevel(this.currentLevel.id);
        this.shop.trackBestRun({
            level: this.currentLevel.id,
            crowd: this.crowd.count,
            damage: this.fortress.damageDealt,
            coins: coins,
        });
        this.ui.resultData = {
            crowdRemaining: this.crowd.count,
            damageDealt: this.fortress.damageDealt,
            coinsEarned: coins,
        };
        this.ui.rewarded2x = false;
        this.state = 'RESULTS';
        if (typeof Android !== 'undefined' && Android.showBanner) {
            try { Android.showBanner(); } catch(e) {}
        }
    }

    start() {
        this.lastTime = performance.now();
        requestAnimationFrame(t => this.loop(t));
    }

    loop(ts) {
        const dt = Math.min((ts - this.lastTime) / 1000, 0.05);
        this.lastTime = ts;
        this.update(dt);
        this.render();
        requestAnimationFrame(t => this.loop(t));
    }

    update(dt) {
        this.ui.update(dt);
        this.particles.update(dt);
        this.floatingText.update(dt);
        this.screenFx.update(dt);
        this.combo.update(dt);

        // Fever Timer Update
        if (this.feverActive) {
            this.feverTimer -= dt;
            const duration = this.shop.getFeverDuration();
            this.feverGauge = Math.max(0, (this.feverTimer / duration) * GC.FEVER_MAX);
            if (this.feverTimer <= 0) {
                this.feverActive = false;
                this.feverGauge = 0;
            }
        }

        if (this.state === 'PLAYING') {
            if (this.feverActive) {
                this.crowd.speed = this.shop.getSpeed() * GC.RUSH_SPEED_MULT;
                // Emit fever particles projected from crowd 3D center
                const vec = new THREE.Vector3();
                vec.setFromMatrixPosition(this.crowd.group.matrixWorld);
                vec.project(this.camera);
                const sx = (vec.x * 0.5 + 0.5) * GC.W;
                const sy = -(vec.y * 0.5 - 0.5) * GC.H;
                this.particles.feverTrail(sx, sy, 4);
            }
            this.crowd.update(dt, true);
            this.gates.update(dt, this.crowd.worldY);
            this.obstacles.update(dt, this.crowd.worldY);
            this.enemies.update(dt, this.crowd.worldY);
            this.fortress.update(dt, this.crowd.worldY);

            if (this.screenFx.vignetteO > 0) this.screenFx.vignetteO = 0;

            const mag = this.shop.getGateMagnet();
            if (mag > 0) this._applyMagnet(mag);

            if (this.crowd.worldY >= this.currentLevel.laneLength - 40 && this.fortress.state === 'waiting') {
                this.fortress.startAttack();
                this.state = 'FORTRESS_ATTACK';
                this.screenFx.pulseVignette('#FF8800', 999);
            }
            if (this.crowd.count <= 0) {
                this.state = 'GAME_OVER';
                if (typeof Android !== 'undefined' && Android.showBanner) {
                    try { Android.showBanner(); } catch(e) {}
                }
            }
            
            // Move camera forward based on crowd progress
            // Crowd starts at z=0 and moves forward (negative Z in ThreeJS)
            // Wait, we need to map crowd.worldY to Three.js coordinates in crowd.js
            
        } else if (this.state === 'CLASH') {
            this.crowd.update(dt, false);
            this.enemies.update(dt, this.crowd.worldY);
            if (this.crowd.count <= 0) {
                this.screenFx.pulseVignette('transparent', 0);
                this.state = 'GAME_OVER';
                if (typeof Android !== 'undefined' && Android.showBanner) {
                    try { Android.showBanner(); } catch(e) {}
                }
            }
        } else if (this.state === 'FORTRESS_ATTACK') {
            this.crowd.update(dt, false);
            this.fortress.update(dt, this.crowd.worldY);
            if (this.fortress.state === 'destroyed') {
                this.screenFx.pulseVignette('transparent', 0);
            }
        }
        
        // Handle Mock Ad playback
        if (this.adPlaying) {
            this.adTimer += dt;
            if (this.adTimer >= 2.5) { // 2.5 second mock ad
                this.adPlaying = false;
                if (this.adRewardCallback) {
                    this.adRewardCallback();
                    this.adRewardCallback = null;
                }
            }
        }
        
        // 3D Camera Dynamic Logic & Screen Shake
        const crowdZ = this.crowd.group.position.z;
        let targetZ, targetY, targetX;

        if (this.state === 'CLASH' || this.state === 'FORTRESS_ATTACK') {
            // Zoom in for dramatic fight view
            targetZ = crowdZ + 60;
            targetY = 40;
            targetX = this.crowd.group.position.x * 0.5;
        } else {
            // Standard follow-cam — fixed height so nothing disappears
            targetZ = crowdZ + 90;
            targetY = 70;
            targetX = this.crowd.group.position.x * 0.7;
        }
        
        const lerpCamX = 1 - Math.pow(1 - 0.15, dt * 60);
        const lerpCamZ = 1 - Math.pow(1 - 0.22, dt * 60);

        this.camera.position.x = Utils.lerp(this.camera.position.x, targetX, lerpCamX);
        this.camera.position.y = Utils.lerp(this.camera.position.y, targetY, lerpCamX);
        this.camera.position.z = Utils.lerp(this.camera.position.z, targetZ, lerpCamZ);
        
        // Apply 3D Screen Shake from screenFx
        let cx = this.camera.position.x;
        let cy = this.camera.position.y;
        if (this.screenFx.ox !== 0 || this.screenFx.oy !== 0) {
            cx += this.screenFx.ox * 0.5;
            cy += this.screenFx.oy * 0.5;
        }
        this.camera.position.set(cx, cy, this.camera.position.z);
        
        // Always look ahead of the crowd along the track
        this.camera.lookAt(0, 0, crowdZ - 50);

        // Slide city background with camera
        this.cityGroup.position.z = this.camera.position.z - 1000;
    }

    showAd(rewardType, callback) {
        if (this.adPlaying) return;
        
        // Android Unity Ads Native Integration
        if (typeof Android !== 'undefined' && Android.showAd) {
            this.adPlaying = true;
            this.adRewardCallback = callback;
            
            // Register a global callback that Android Studio will trigger
            window.onUnityAdFinished = (success) => {
                this.adPlaying = false;
                if (success && this.adRewardCallback) {
                    this.adRewardCallback();
                }
                this.adRewardCallback = null;
            };
            
            // Call the native Android interface with the Placement ID
            Android.showAd('Rewarded_Android');
        } else {
            // Fallback Mock Ad Manager (for local web testing)
            this.adPlaying = true;
            this.adTimer = 0;
            this.adRewardCallback = callback;
        }
    }

    _applyMagnet(str) {
        for (const pair of this.gates.pairs) {
            if (pair.passed) continue;
            const dist = pair.y - this.crowd.worldY;
            if (dist > 0 && dist < 200) {
                const lv = this._evalGate(pair.left);
                const rv = this._evalGate(pair.right);
                const target = lv > rv ? -0.5 : 0.5;
                this.crowd.laneX = Utils.lerp(this.crowd.laneX, target, str * 0.02);
                break;
            }
        }
    }

    _evalGate(g) {
        const c = this.crowd.count;
        switch(g.type) {
            case 'multiply': return c * g.value;
            case 'add': return c + g.value;
            case 'divide': return c / g.value;
            case 'subtract': return c - g.value;
            default: return c;
        }
    }

    render() {
        // --- 1. Render 3D Scene ---
        // NOTE: Camera is fully managed in update(). Do NOT reposition here to avoid jitter.
        this.renderer.render(this.scene, this.camera);

        // --- 2. Render 2D UI Overlay ---
        const ctx = this.uiCtx;
        ctx.clearRect(0, 0, this.uiCanvas.width, this.uiCanvas.height);
        
        ctx.save();
        this.screenFx.apply(ctx);

        if (this.state === 'MENU') {
            // Fill background slightly dark to make UI readable
            ctx.fillStyle = 'rgba(10, 15, 30, 0.6)';
            ctx.fillRect(0, 0, GC.W, GC.H);
            
            if (this.ui.showingShop) this.ui.drawShop(ctx);
            else this.ui.drawMainMenu(ctx);
        } else if (['PLAYING','CLASH','FORTRESS_ATTACK'].includes(this.state)) {
            // 3D scene handles game rendering, UI just draws HUD
            this.gates.draw(ctx, this.crowd.worldY);
            this.enemies.draw(ctx, this.crowd.worldY);
            this.fortress.draw(ctx, this.crowd.worldY);
            this.particles.draw(ctx);
            
            this.combo.draw(ctx);
            this.ui.drawHUD(ctx);
        } else if (this.state === 'GAME_OVER') {
            this.ui.drawGameOver(ctx);
        } else if (this.state === 'RESULTS') {
            this.ui.drawResults(ctx);
        }

        // Draw Mock Ad Overlay
        if (this.adPlaying) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.fillRect(0, 0, GC.W, GC.H);
            
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 24px "Outfit", sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('📺 SPONSOR MESSAGE', GC.W / 2, GC.H / 2 - 20);
            
            ctx.fillStyle = '#888';
            ctx.font = '14px "Outfit", sans-serif';
            const left = Math.ceil(2.5 - this.adTimer);
            ctx.fillText(`Reward in ${left}s...`, GC.W / 2, GC.H / 2 + 20);
            
            // Spinning loader
            ctx.save();
            ctx.translate(GC.W / 2, GC.H / 2 + 60);
            ctx.rotate(this.lastTime * 0.005);
            ctx.strokeStyle = '#00B4FF';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI * 1.5);
            ctx.stroke();
            ctx.restore();
        }

        this.screenFx.drawFlash(ctx, GC.W, GC.H);
        ctx.restore();
    }
}

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
    const gameCanvas = document.getElementById('gameCanvas');
    const uiCanvas = document.getElementById('uiCanvas');
    const game = new Game(gameCanvas, uiCanvas);
    game.start();
    window.game = game;
});
