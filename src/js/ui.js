// ============================================================
// ui.js — Professional Mobile Game HUD & Menus
// ============================================================

class UI {
    constructor(game) {
        this.game = game;
        this.crowdDisplay = 0;
        this.crowdScale = 1;
        this.coinDisplay = 0;
        this.showingShop = false;
        this.showingWorldMap = false;
        this.showingSettings = false;
        this.showingLeaderboard = false;
        this.showingPrivacyPolicy = false;
        this.showingTerms = false;
        this.activeButtons = [];
        this.resultData = null;
        this.t = 0;
        
        // Theme colors (default Cyan)
        this.themeColors = { primary: '#00B4FF', secondary: '#00FFCC', bg: '#1E90FF' };

        // Left panel state
        this._leftPanelAnim = [0, 0, 0]; // slide-in per button
        this._notifPulse = 0;

        // Number pops for HUD feedback
        this._hudPops = [];

        // Attack banner slide-in
        this._attackBannerAlpha = 0;

        // Crowd badge pop
        this._badgePop = 1;

        // Shop tab state: 'upgrades' | 'skins'
        this._shopTab = 'upgrades';
        // Shop skins scroll offset
        this._shopScrollY = 0;
        this._shopLastTouchY = null;
        // World Map scroll offset
        this._wmScrollY = 0;
        this._wmLastTouchY = null;
    }

    _applyTheme(theme) {
        if (theme === 'meadow') {
            this.themeColors = { primary: '#1B8C32', secondary: '#27A842', bg: '#228B22' };
        } else if (theme === 'desert') {
            this.themeColors = { primary: '#D46A25', secondary: '#FF9500', bg: '#CC5500' };
        } else if (theme === 'volcano') {
            this.themeColors = { primary: '#FF3300', secondary: '#FFAA00', bg: '#8B1A00' };
        } else {
            // City / Default
            this.themeColors = { primary: '#00B4FF', secondary: '#00FFCC', bg: '#1E90FF' };
        }
    }

    update(dt) {
        this.t += dt;
        const target = this.game.crowd ? this.game.crowd.count : 0;
        const prev = this.crowdDisplay;
        if (target < this.crowdDisplay) {
            this.crowdDisplay = target;
            this._badgePop = 1.25;
        } else {
            this.crowdDisplay = Utils.lerp(this.crowdDisplay, target, 0.2);
        }
        if (Math.abs(this.crowdDisplay - target) < 1) this.crowdDisplay = target;
        if (Math.abs(prev - this.crowdDisplay) > 0.5) this._badgePop = Math.max(this._badgePop, 1.2);
        this._badgePop = Utils.lerp(this._badgePop, 1, 0.14);

        this.coinDisplay = Utils.lerp(this.coinDisplay, this.game.shop.getCoins(), 0.1);
        this._notifPulse += dt * 3;

        // Left panel is hidden during gameplay — always keep at 0
        for (let i = 0; i < 3; i++) {
            this._leftPanelAnim[i] = 0;
        }

        // Attack banner fade in
        if (this.game.state === 'FORTRESS_ATTACK') {
            this._attackBannerAlpha = Utils.lerp(this._attackBannerAlpha, 1, 0.08);
        } else {
            this._attackBannerAlpha = Utils.lerp(this._attackBannerAlpha, 0, 0.15);
        }

        // HUD pops
        for (const p of this._hudPops) {
            p.life -= dt;
            p.y -= 40 * dt;
            p.alpha = Utils.clamp(p.life * 3, 0, 1);
        }
        this._hudPops = this._hudPops.filter(p => p.life > 0);
    }

    addHudPop(text, color = '#FFF') {
        this._hudPops.push({ text, color, x: GC.W / 2, y: 200, life: 1.2, alpha: 1 });
    }

    // ============================================================
    // GAMEPLAY HUD
    // ============================================================
    drawHUD(ctx) {
        this.activeButtons = [];
        const w = GC.W;

        // === 1. TOP PROGRESS BAR ===
        this._drawProgressBar(ctx, w);

        // === 2. FEVER METER BAR ===
        this._drawFeverMeter(ctx, w);

        // === 3. COINS / GEMS TOP-RIGHT ===
        this._drawCoinBadge(ctx, w);

        // === 4. CROWD COUNT BADGE (above the crowd on-screen) ===
        this._drawCrowdBadge(ctx, w);

        // === 5. EXIT / PAUSE BUTTON (top-left) ===
        this._drawExitButton(ctx);

        // === 6. FORTRESS PHASE + ATTACK BANNER ===
        if (this.game.state === 'FORTRESS_ATTACK') {
            this._drawAttackBanner(ctx, w);
        }

        // === 7. CLASH INDICATOR ===
        if (this.game.state === 'CLASH') {
            this._drawClashBanner(ctx, w);
        }

        // === 8. COMBO INDICATOR ===
        const combo = this.game.combo;
        if (combo && combo.count >= 2) {
            this._drawComboIndicator(ctx, combo);
        }

        // === 9. SHIELD TIMER ===
        if (this.game.crowd.shielded && this.game.crowd.shieldTime > 0) {
            this._drawShieldTimer(ctx);
        }

        // === 9. HUD NUMBER POPS ===
        for (const p of this._hudPops) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.font = 'bold 20px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;
            ctx.fillText(p.text, p.x, p.y);
            ctx.restore();
        }
        
        // === 10. FLOATING TEXT (GAME JUICE) ===
        if (this.game.floatingText) {
            this.game.floatingText.draw(ctx);
        }

        // === 11. VICTORY BANNER ===
        if (this.game.fortress.state === 'destroyed') {
            this._drawVictoryBanner(ctx, w);
        }
    }

    _drawProgressBar(ctx, w) {
        const prog = this.game.currentLevel
            ? Utils.clamp(this.game.crowd.worldY / this.game.currentLevel.laneLength, 0, 1)
            : 0;

        const bx = 56, by = 16, bw = w * 0.45, bh = 18;
        const radius = bh / 2;

        ctx.save();
        // Track background with premium glass border
        ctx.fillStyle = 'rgba(10, 15, 40, 0.6)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, radius); ctx.fill(); ctx.stroke();

        // Filled bar
        if (prog > 0.01) {
            const fg = ctx.createLinearGradient(bx, 0, bx + bw * prog, 0);
            fg.addColorStop(0, this.themeColors.primary);
            fg.addColorStop(1, this.themeColors.secondary);
            ctx.fillStyle = fg;
            ctx.beginPath(); ctx.roundRect(bx, by, bw * prog, bh, radius); ctx.fill();
        }

        // Level badge (circle on left)
        const lvNum = this.game.currentLevel ? this.game.currentLevel.id : 1;
        ctx.fillStyle = this.themeColors.primary;
        ctx.beginPath(); ctx.arc(bx + 4, by + bh / 2, bh / 2 + 4, 0, Math.PI * 2); ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.font = `bold 12px "Outfit", sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(lvNum, bx + 4, by + bh / 2 + 1);
        
        // "LEVEL 3" text
        ctx.fillStyle = '#FFF';
        ctx.font = `bold 10px "Outfit", sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(`LEVEL ${lvNum}`, bx + 22, by + bh / 2 + 1);

        ctx.restore();
    }

    _drawFeverMeter(ctx, w) {
        const fever = this.game.feverGauge || 0;
        const max = GC.FEVER_MAX;
        const ratio = Utils.clamp(fever / max, 0, 1);
        const isActive = this.game.feverActive;

        ctx.save();
        const bx = w / 2 - 90;
        const by = 42;
        const bw = 180;
        const bh = 14;

        // Background Glass Container
        ctx.fillStyle = 'rgba(10, 15, 30, 0.6)';
        ctx.strokeStyle = isActive ? 'rgba(0, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = isActive ? 2 : 1;
        ctx.shadowColor = isActive ? '#00FFFF' : 'transparent';
        ctx.shadowBlur = isActive ? 15 : 0;

        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 7);
        ctx.fill();
        ctx.stroke();

        // Fill Bar
        if (ratio > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(bx + 2, by + 2, Math.max(8, (bw - 4) * ratio), bh - 4, 5);
            ctx.clip();

            const gradient = ctx.createLinearGradient(bx, by, bx + bw, by);
            if (isActive) {
                const shift = (this.t * 300) % 360;
                gradient.addColorStop(0, `hsl(${shift}, 100%, 60%)`);
                gradient.addColorStop(0.5, `hsl(${(shift + 120) % 360}, 100%, 65%)`);
                gradient.addColorStop(1, `hsl(${(shift + 240) % 360}, 100%, 60%)`);
            } else {
                gradient.addColorStop(0, '#FF00A0');
                gradient.addColorStop(0.5, '#FF8800');
                gradient.addColorStop(1, '#FFCC00');
            }

            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.restore();
        }

        // Label / Text
        ctx.font = '900 10px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = isActive ? '#00FFFF' : 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 6;
        ctx.fillText(isActive ? '🔥 HYPER RUSH! 🔥' : `FEVER ${Math.floor(ratio * 100)}%`, w / 2, by + bh / 2 + 1);

        ctx.restore();
    }

    _drawExitButton(ctx) {
        // Small circular exit/home button at top-left
        const cx = 26, cy = 17, r = 13;

        ctx.save();

        // Circle background
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath(); ctx.arc(cx + 1, cy + 1, r, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#334466';
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

        // Border
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

        // Home icon (simplified)
        ctx.fillStyle = '#AAC8EE';
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏠', cx, cy);

        ctx.restore();
        this._regBtn(cx - 20, cy - 17, 40, 40, 'exitToMenu');
    }

    _drawCoinBadge(ctx, w) {
        // Gem icon + coin count pill — top right (matching reference)
        const bw = 90, bh = 28;
        const bx = w - bw - 12, by = 12;

        ctx.save();
        // Pill background with premium glass border
        ctx.fillStyle = 'rgba(10, 15, 40, 0.6)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, bh / 2); ctx.fill(); ctx.stroke();

        // Gem icon
        const cx = bx + 14, cy = by + bh / 2;
        ctx.fillStyle = '#C424FF'; // Purple outer
        ctx.beginPath();
        ctx.moveTo(cx, cy - 8);
        ctx.lineTo(cx + 8, cy - 2);
        ctx.lineTo(cx, cy + 8);
        ctx.lineTo(cx - 8, cy - 2);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#E894FF'; // Purple inner/highlight
        ctx.beginPath();
        ctx.moveTo(cx, cy - 8);
        ctx.lineTo(cx + 8, cy - 2);
        ctx.lineTo(cx, cy - 2);
        ctx.closePath(); ctx.fill();

        // Value text
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 14px "Outfit", sans-serif';
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText(Utils.formatNumber(Math.round(this.coinDisplay)), bx + bw - 12, cy);
        
        // Pause Button (Right below or next to it)
        const pbx = w - 36, pby = by + bh + 12, pr = 14;
        ctx.fillStyle = 'rgba(10, 15, 40, 0.6)';
        ctx.beginPath(); ctx.arc(pbx, pby, pr, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.fillRect(pbx - 4, pby - 5, 3, 10);
        ctx.fillRect(pbx + 1, pby - 5, 3, 10);
        
        ctx.restore();
    }

    _drawCrowdBadge(ctx, w) {
        const count = Math.round(this.crowdDisplay);
        // Positioned above the crowd character on screen
        const cx = GC.W / 2 + (this.game.crowd ? this.game.crowd.laneX * GC.LANE_W * 0.44 : 0);
        const cy = GC.CROWD_SCREEN_Y - 60;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(this._badgePop, this._badgePop);

        let displayStr = Utils.formatNumber(count);
        let giants = 0;
        if (this.game.crowd) {
            giants = this.game.crowd.units.filter(u => u.alive && u.type === 'giant').length;
            if (giants > 0) {
                displayStr = `${displayStr} (👹${giants})`;
            }
        }
        
        ctx.font = 'bold 16px "Outfit", sans-serif';
        const textWidth = Math.max(56, ctx.measureText(displayStr).width + 20);
        const halfW = textWidth / 2;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.roundRect(-halfW - 2, -16, textWidth + 4, 32, 8); ctx.fill();

        // Blue badge background (or themed)
        const bg = ctx.createLinearGradient(0, -16, 0, 16);
        bg.addColorStop(0, this.themeColors.bg);
        bg.addColorStop(1, this.themeColors.primary);
        ctx.fillStyle = bg;
        ctx.beginPath(); ctx.roundRect(-halfW, -14, textWidth, 28, 7); ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath(); ctx.roundRect(-halfW, -14, textWidth, 12, 7); ctx.fill();

        // Count text
        ctx.fillStyle = '#FFF';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 3;
        ctx.fillText(displayStr, 0, 1);

        ctx.restore();
    }

    _drawLeftPanel(ctx) {
        // Left side buttons: Gun, Daily, Skins
        const btns = [
            { icon: '🔫', label: 'GUN', color: '#1B82EE', notif: true },
            { icon: '📅', label: 'DAILY', color: '#12A155', notif: true },
            { icon: '👕', label: 'SKINS', color: '#8844D5', notif: false },
        ];

        const btnW = 44, btnH = 50;
        const startY = 80;
        const gap = 60;

        for (let i = 0; i < btns.length; i++) {
            // Force it to be visible for the test
            const b = btns[i];
            const bx = 12;
            const by = startY + i * gap;

            ctx.save();
            ctx.translate(bx, by);

            // Button body
            ctx.fillStyle = b.color;
            ctx.beginPath(); ctx.roundRect(0, 0, btnW, btnH, 8); ctx.fill();

            // Icon
            ctx.font = '20px sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(b.icon, btnW / 2, btnH / 2 - 6);

            // Label
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 9px "Outfit", sans-serif';
            ctx.fillText(b.label, btnW / 2, btnH - 10);

            // Notification badge (red circle with '1')
            if (b.notif) {
                ctx.fillStyle = '#E62E2E';
                ctx.beginPath(); ctx.arc(btnW - 2, -2, 8, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#FFF';
                ctx.font = 'bold 10px "Outfit", sans-serif';
                ctx.fillText('1', btnW - 2, -1);
            }

            ctx.restore();
        }
    }

    _drawCircularCombatGauge(ctx, w, ratio, label, title, emoji, colorHex, glowColor) {
        ctx.save();
        
        const cx = w / 2;
        const cy = 100;
        const r = 26;

        // 1. Concentric rotating outer dotted ring (Scanner style)
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 11]);
        ctx.beginPath();
        ctx.arc(cx, cy, r + 5, this.t * 0.4, this.t * 0.4 + Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 2. Outer thin guide ring
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
        ctx.stroke();

        // 3. Label Pill Background (Sleek dark-glass pill)
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(cx - 75, cy + 34, 150, 32, 10);
        ctx.fill();
        ctx.stroke();

        // Small indicator dots matching theme
        ctx.fillStyle = colorHex;
        ctx.beginPath();
        ctx.arc(cx - 62, cy + 50, 3, 0, Math.PI * 2);
        ctx.arc(cx + 62, cy + 50, 3, 0, Math.PI * 2);
        ctx.fill();

        // 4. Circular Outer Track (dark backing)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 5;
        ctx.setLineDash([5, 2]);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        // 5. Circular Progress Ring (glowing neon stroke)
        if (ratio > 0) {
            ctx.save();
            ctx.strokeStyle = colorHex;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 10;
            ctx.lineWidth = 5;
            ctx.lineCap = 'butt';
            ctx.setLineDash([5, 2]);
            ctx.beginPath();
            ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + ratio * Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // 6. Inner guide ring
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
        ctx.stroke();

        // 7. Dial Center Backing
        ctx.fillStyle = 'rgba(10, 15, 30, 0.9)';
        ctx.beginPath();
        ctx.arc(cx, cy, r - 4.5, 0, Math.PI * 2);
        ctx.fill();

        // 8. Dial Emoji
        ctx.font = '15px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, cx, cy + 1);

        // 9. Text details
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px "Outfit", sans-serif';
        ctx.fillText(title, cx, cy + 46);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = 'bold 9px "Outfit", sans-serif';
        ctx.fillText(label, cx, cy + 58);

        ctx.restore();
    }

    _drawAttackBanner(ctx, w) {
        if (this._attackBannerAlpha < 0.02) return;

        const phases = this.game.fortress.phases;
        const idx = this.game.fortress.phaseIndex;
        const phase = this.game.fortress.currentPhase;

        if (!phase) return;

        ctx.save();
        ctx.globalAlpha = this._attackBannerAlpha;

        const hpText = `${Math.ceil(this.game.fortress.hp)} / ${this.game.fortress.maxHP}`;
        const hpRatio = Utils.clamp(this.game.fortress.hp / this.game.fortress.maxHP, 0, 1);
        const title = `${phase.label} [${idx + 1}/${phases ? phases.length : 1}]`;

        this._drawCircularCombatGauge(ctx, w, hpRatio, hpText, title, '🏰', '#FF3366', '#FF0055');

        ctx.restore();
    }

    _drawClashBanner(ctx, w) {
        const clashIndex = this.game.enemies ? this.game.enemies.currentClash : null;
        const activeMob = (clashIndex !== null && clashIndex >= 0) ? this.game.enemies.mobs[clashIndex] : null;

        if (!activeMob) return;

        const types = (typeof ENEMY_TYPES !== 'undefined') ? ENEMY_TYPES : {
            normal: { color: 0xFF4444, emoji: '⚔️', name: 'Warrior' }
        };
        const typeInfo = types[activeMob.type] || types.normal;
        const name = typeInfo.name;
        const emoji = typeInfo.emoji;
        const color = '#' + typeInfo.color.toString(16).padStart(6, '0');

        const hpRatio = Utils.clamp(activeMob.count / activeMob.maxCount, 0, 1);
        const hpText = `${activeMob.count} / ${activeMob.maxCount}`;
        const title = `${name.toUpperCase()} CLASH`;

        this._drawCircularCombatGauge(ctx, w, hpRatio, hpText, title, emoji, color, color);
    }

    _drawComboIndicator(ctx, combo) {
        const mult = combo.getMultiplier();
        ctx.save();
        ctx.translate(GC.W - 10, 110);

        // Background pill
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.roundRect(-85, -16, 86, 32, 12); ctx.fill();

        const g = ctx.createLinearGradient(-84, 0, 0, 0);
        g.addColorStop(0, this.themeColors.primary);
        g.addColorStop(1, this.themeColors.secondary);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.roundRect(-84, -15, 84, 30, 11); ctx.fill();

        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 12px "Outfit", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 3;
        ctx.fillText(`🔥 x${combo.count} (×${mult})`, -42, 0);

        // Combo timer bar
        const tw = 84 * (combo.timer / combo.WINDOW);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.roundRect(-84, 17, 84, 5, 3); ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.beginPath(); ctx.roundRect(-84, 17, tw, 5, 3); ctx.fill();

        ctx.restore();
    }

    _drawShieldTimer(ctx) {
        const t = this.game.crowd.shieldTime;
        ctx.save();
        ctx.translate(GC.W - 10, 150);
        ctx.fillStyle = 'rgba(0,180,255,0.9)';
        ctx.beginPath(); ctx.roundRect(-85, -14, 86, 28, 10); ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 12px "Outfit", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`🛡️ SHIELD ${Math.ceil(t)}s`, -42, 0);
        ctx.restore();
    }

    _drawVictoryBanner(ctx, w) {
        const p = Math.sin(this.t * 6) * 0.06 + 0.94;
        ctx.save();
        ctx.translate(w / 2, GC.H / 2 - 60);
        ctx.scale(p, p);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 42px "Outfit", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = '#FF8800'; ctx.shadowBlur = 25;
        ctx.fillText('🏆 VICTORY! 🏆', 0, 0);
        ctx.restore();
    }

    _regBtn(x, y, w, h, id) {
        if (id) {
            this.activeButtons.push({ x, y, w, h, id });
        }
    }

    // ============================================================
    // BUTTON HELPER — 3D Pill / Tactile style
    // ============================================================
    _btn(ctx, x, y, w, h, text, c1, c2, id) {
        ctx.save();
        const r = Math.min(h / 2, 16);

        // Ambient glow for interactivity
        const glowPhase = (this.t * 2 + (x * 0.01)) % (Math.PI * 2);
        const glowAlpha = 0.4 + Math.sin(glowPhase) * 0.2;
        ctx.shadowColor = c2;
        ctx.shadowBlur = 15 * glowAlpha;
        
        // Soft drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath(); ctx.roundRect(x - w/2, y - h/2 + 6, w, h, r); ctx.fill();
        ctx.shadowBlur = 0; // Reset for crisp layers

        // 3D base depth (Darker rim)
        ctx.fillStyle = c1;
        ctx.beginPath(); ctx.roundRect(x - w/2, y - h/2 + 4, w, h, r); ctx.fill();

        // Main glass body gradient
        const g = ctx.createLinearGradient(x, y - h/2, x, y + h/2);
        g.addColorStop(0, c2);
        g.addColorStop(0.4, c2);
        g.addColorStop(1, c1);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.roundRect(x - w/2, y - h/2, w, h, r); ctx.fill();

        // Dynamic Glass Specular Highlight (Sweeping reflection)
        const shineG = ctx.createLinearGradient(x - w/2, y - h/2, x + w/2, y + h/2);
        const sweep = (this.t * 0.5) % 2; // Sweeps from 0 to 2
        const pos = sweep - 0.4;
        const p0 = Math.max(0, Math.min(1, pos - 0.2));
        const p1 = Math.max(0, Math.min(1, pos));
        const p2 = Math.max(0, Math.min(1, pos + 0.2));
        shineG.addColorStop(p0, 'rgba(255, 255, 255, 0)');
        shineG.addColorStop(p1, 'rgba(255, 255, 255, 0.4)');
        shineG.addColorStop(p2, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = shineG;
        ctx.beginPath(); ctx.roundRect(x - w/2 + 2, y - h/2 + 2, w - 4, h * 0.45, r - 2); ctx.fill();

        // Inner rim light (Top edge highlight)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x - w/2 + r, y - h/2 + r, r, Math.PI, 1.5 * Math.PI);
        ctx.lineTo(x + w/2 - r, y - h/2);
        ctx.arc(x + w/2 - r, y - h/2 + r, r, 1.5 * Math.PI, 2 * Math.PI);
        ctx.stroke();

        // Typography with deep text shadow
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `800 ${Math.min(18, h * 0.45)}px "Outfit", sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'; 
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;
        ctx.fillText(text, x, y);

        // Reset shadow state before restore
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.restore();
        if (id) this._regBtn(x - w/2, y - h/2, w, h, id);
        return { x: x - w/2, y: y - h/2, w, h, id };
    }

    // ============================================================
    // MAIN MENU
    // ============================================================
    drawMainMenu(ctx) {
        this.activeButtons = [];
        const w = GC.W, h = GC.H; // 400 x 720

        if (this.showingPrivacyPolicy) { this.drawPrivacyPolicy(ctx); return; }
        if (this.showingTerms)         { this.drawTerms(ctx); return; }
        if (this.showingShop)          { this.drawShop(ctx); return; }
        if (this.showingWorldMap)      { this.drawWorldMap(ctx); return; }
        if (this.showingSettings)      { this.drawSettings(ctx); return; }
        if (this.showingLeaderboard)   { this.drawLeaderboard(ctx); return; }

        // ── 1. DEEP SPACE BACKGROUND ─────────────────────────────────────
        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, '#050C1A');
        bg.addColorStop(0.5, '#0B1230');
        bg.addColorStop(1, '#030810');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // ── 2. AURORA NEBULA ORBS (using globalAlpha, not screen blend) ──
        ctx.save();
        const orbDefs = [
            { cx: w * 0.15 + Math.sin(this.t * 0.5) * 40, cy: h * 0.18 + Math.cos(this.t * 0.4) * 40, r: 200, r_inner: 0, ca: 0.18, color: '0, 229, 255' },
            { cx: w * 0.9  + Math.cos(this.t * 0.6) * 45, cy: h * 0.35 + Math.sin(this.t * 0.5) * 45, r: 240, r_inner: 0, ca: 0.14, color: '255, 46, 147'  },
            { cx: w * 0.5  + Math.sin(this.t * 0.3) * 60, cy: h * 0.65 + Math.cos(this.t * 0.7) * 35, r: 260, r_inner: 0, ca: 0.10, color: '112, 0, 255'   },
        ];
        for (const o of orbDefs) {
            const grad = ctx.createRadialGradient(o.cx, o.cy, o.r_inner, o.cx, o.cy, o.r);
            grad.addColorStop(0, `rgba(${o.color}, ${o.ca})`);
            grad.addColorStop(1, `rgba(${o.color}, 0)`);
            ctx.globalAlpha = 1;
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(o.cx, o.cy, o.r, 0, Math.PI * 2); ctx.fill();
        }
        // Floating star particles
        for (let i = 0; i < 35; i++) {
            const px = ((i * 137 + this.t * 12) % w);
            const py = ((i * 179 + this.t * 20) % h);
            ctx.globalAlpha = 0.12 + Math.sin(i * 0.8 + this.t * 2) * 0.1;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath(); ctx.arc(px, py, (i % 3 === 0) ? 1.5 : 1, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.restore();

        // ── LAYOUT CONSTANTS (absolute px for 720px canvas) ──────────────
        //   Title center:         y = 125
        //   Level card center:    y = 270
        //   PLAY button center:   y = 375
        //   Bottom tabs center:   y = 460
        //   Coin badge center:    y = 550
        //   Daily Quest center:   y = 625
        //   Version text:         y = 705

        const TITLE_Y      = 128;
        const LEVEL_Y      = 272;
        const PLAY_Y       = 378;
        const TABS_Y       = 462;
        const COIN_Y       = 552;
        const DAILY_Y      = 628;

        // ── 3. TITLE CARD ─────────────────────────────────────────────────
        this._drawTitleCard(ctx, w, h, TITLE_Y);

        // ── 4. LEVEL SELECTOR CARD ────────────────────────────────────────
        this._drawLevelCard(ctx, w, h, LEVEL_Y);

        // ── 5. PLAY BUTTON ────────────────────────────────────────────────
        ctx.save();
        const auraSize = 14 + Math.sin(this.t * 4) * 8;
        ctx.shadowColor = '#00EE77';
        ctx.shadowBlur = auraSize;
        ctx.fillStyle = 'rgba(0, 238, 119, 0.12)';
        ctx.beginPath(); ctx.roundRect(w / 2 - 105, PLAY_Y - 30, 210, 60, 18); ctx.fill();
        ctx.restore();
        this._btn(ctx, w / 2, PLAY_Y, 210, 56, '▶   PLAY', '#00AA55', '#00EE77', 'play');

        // ── 6. BOTTOM ICON TABS ───────────────────────────────────────────
        this._drawMenuBottomRow(ctx, w, h, TABS_Y);

        // ── 7. COIN BADGE ─────────────────────────────────────────────────
        this._drawMenuCoinBadge(ctx, w, COIN_Y);

        // ── 8. DAILY QUEST BANNER ─────────────────────────────────────────
        const dw = w - 32, dh = 50;
        const dlx = w / 2 - dw / 2, dly = DAILY_Y - dh / 2;
        ctx.save();
        ctx.shadowColor = 'rgba(192, 132, 252, 0.55)';
        ctx.shadowBlur = 18 + Math.sin(this.t * 3) * 5;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = 'rgba(35, 15, 75, 0.75)';
        ctx.beginPath(); ctx.roundRect(dlx, dly, dw, dh, 14); ctx.fill();
        ctx.shadowColor = 'transparent'; ctx.shadowOffsetY = 0;
        // Gradient sheen
        const dg = ctx.createLinearGradient(dlx, dly, dlx + dw, dly + dh);
        dg.addColorStop(0, 'rgba(192, 132, 252, 0.3)');
        dg.addColorStop(0.5, 'rgba(255, 100, 255, 0.08)');
        dg.addColorStop(1, 'rgba(192, 132, 252, 0.3)');
        ctx.fillStyle = dg;
        ctx.beginPath(); ctx.roundRect(dlx, dly, dw, dh, 14); ctx.fill();
        // Neon border
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.75)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(dlx, dly, dw, dh, 14); ctx.stroke();
        ctx.restore();
        // Text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px "Outfit", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('📅  DAILY QUEST: PLAY TODAY\'S UNIQUE LEVEL', w / 2, DAILY_Y - 7);
        ctx.fillStyle = '#C084FC';
        ctx.font = 'bold 10px "Outfit", sans-serif';
        ctx.fillText('REWARD: +2,000 COINS & A RANDOM FREE SKIN!', w / 2, DAILY_Y + 11);
        this._regBtn(dlx, dly, dw, dh, 'daily_level');

        // ── 9. VERSION TEXT ───────────────────────────────────────────────
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.font = '10px "Outfit", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('Crowd Rush v2.0 — Premium Edition', w / 2, h - 10);
    }

    _drawTitleCard(ctx, w, h, cy) {
        const ts = 1 + Math.sin(this.t * 2) * 0.015;

        ctx.save();
        ctx.translate(w / 2, cy);
        ctx.scale(ts, ts);

        // 1. Draw glowing background particle rays
        ctx.save();
        for (let i = 0; i < 16; i++) {
            const angle = (i * Math.PI / 8) + this.t * 0.2;
            const length = 75 + Math.sin(this.t * 4 + i) * 15;
            const opacity = 0.15 + Math.sin(this.t * 3 + i) * 0.08;
            ctx.strokeStyle = i % 2 === 0 ? '#00E5FF' : '#FF2E93';
            ctx.lineWidth = 2;
            ctx.globalAlpha = opacity;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * 30, Math.sin(angle) * 30);
            ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
            ctx.stroke();
        }
        ctx.restore();

        // 2. Soft ambient glow
        const aura = ctx.createRadialGradient(0, 0, 10, 0, 0, 120);
        aura.addColorStop(0, 'rgba(0, 229, 255, 0.35)');
        aura.addColorStop(0.5, 'rgba(255, 46, 147, 0.15)');
        aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath(); ctx.arc(0, 0, 120, 0, Math.PI * 2); ctx.fill();

        // 3. Futuristic decorative wings (Chevrons)
        ctx.save();
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 15;
        
        // Left pulsing wing
        const leftAlpha = 0.4 + Math.sin(this.t * 5) * 0.3;
        ctx.strokeStyle = '#00E5FF';
        ctx.shadowColor = '#00E5FF';
        ctx.globalAlpha = leftAlpha;
        ctx.beginPath();
        ctx.moveTo(-140, -20);
        ctx.lineTo(-160, 0);
        ctx.lineTo(-140, 20);
        ctx.moveTo(-130, -15);
        ctx.lineTo(-146, 0);
        ctx.lineTo(-130, 15);
        ctx.stroke();

        // Right pulsing wing
        const rightAlpha = 0.4 + Math.cos(this.t * 5) * 0.3;
        ctx.strokeStyle = '#FF2E93';
        ctx.shadowColor = '#FF2E93';
        ctx.globalAlpha = rightAlpha;
        ctx.beginPath();
        ctx.moveTo(140, -20);
        ctx.lineTo(160, 0);
        ctx.lineTo(140, 20);
        ctx.moveTo(130, -15);
        ctx.lineTo(146, 0);
        ctx.lineTo(130, 15);
        ctx.stroke();
        ctx.restore();

        // 4. Cool 3D title text
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = '900 58px "Outfit", sans-serif';

        // CROWD 3D shadow layers (deeper extrusion)
        ctx.fillStyle = '#062B44'; ctx.fillText('CROWD', 0, -24);
        ctx.fillStyle = '#073D55'; ctx.fillText('CROWD', -2, -25);
        ctx.fillStyle = '#095C7A'; ctx.fillText('CROWD', -4, -26);
        ctx.fillStyle = '#007A99'; ctx.fillText('CROWD', -6, -27);

        // CROWD (Electric Cyan Front)
        ctx.shadowColor = 'rgba(0, 229, 255, 0.9)'; ctx.shadowBlur = 25;
        const cyGrad = ctx.createLinearGradient(0, -60, 0, 0);
        cyGrad.addColorStop(0, '#E5FFFF');
        cyGrad.addColorStop(1, '#00BFFF');
        ctx.fillStyle = cyGrad;
        ctx.fillText('CROWD', -7, -28);

        // RUSH 3D shadow layers (deeper extrusion)
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#440A28'; ctx.fillText('RUSH', 0, 32);
        ctx.fillStyle = '#5A0B33'; ctx.fillText('RUSH', -2, 31);
        ctx.fillStyle = '#7A0E3C'; ctx.fillText('RUSH', -4, 30);
        ctx.fillStyle = '#99124D'; ctx.fillText('RUSH', -6, 29);

        // RUSH (Vivid Pink Front)
        ctx.shadowColor = 'rgba(255, 46, 147, 0.9)'; ctx.shadowBlur = 25;
        const pkGrad = ctx.createLinearGradient(0, 0, 0, 60);
        pkGrad.addColorStop(0, '#FFCCEA');
        pkGrad.addColorStop(1, '#D50066');
        ctx.fillStyle = pkGrad;
        ctx.fillText('RUSH', -7, 28);

        // 5. Subtitle badge (Glassmorphic)
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(10, 15, 35, 0.7)';
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
        ctx.lineWidth = 1.5;
        
        ctx.shadowColor = 'rgba(0, 229, 255, 0.5)'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.roundRect(-125, 58, 250, 26, 13); ctx.fill(); ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#E2E8F0';
        ctx.font = 'bold 11.5px "Outfit", sans-serif';
        ctx.fillText('Grow your crowd. Crush the fortress!', 0, 70);

        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    _drawLevelCard(ctx, w, h, cy) {
        const cardW = w - 32, cardH = 76;

        ctx.save();

        // Ambient cyan glow
        ctx.shadowColor = 'rgba(0, 180, 255, 0.4)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 8;

        // Clean glass card
        ctx.fillStyle = 'rgba(15, 25, 45, 0.85)';
        ctx.beginPath(); ctx.roundRect(16, cy - cardH/2, cardW, cardH, 18); ctx.fill();
        
        ctx.shadowColor = 'transparent';

        // Inner glowing border
        ctx.strokeStyle = 'rgba(0, 180, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(16, cy - cardH/2, cardW, cardH, 18); ctx.stroke();

        // Level info
        const lvNum = this.game.shop.getCurrentLevel();
        const li = lvNum - 1;
        const lvName = li < LEVELS.length ? LEVELS[li].name : '—';
        const world = li < LEVELS.length ? LEVELS[li].world : 1;

        ctx.fillStyle = '#00DDFF';
        ctx.font = '900 11px "Outfit", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`WORLD ${world}  ·  LEVEL ${lvNum}`, w / 2, cy - 20);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 22px "Outfit", sans-serif';
        ctx.shadowColor = 'rgba(255,255,255,0.2)'; ctx.shadowBlur = 10;
        ctx.fillText(lvName, w / 2, cy + 2);
        ctx.shadowBlur = 0;

        // Professional Vector Stars
        const best = this.game.shop.getBestForLevel ? this.game.shop.getBestForLevel(lvNum) : null;
        const stars = best ? (best.crowd > 50 ? 3 : best.crowd > 20 ? 2 : 1) : 0;
        
        const drawStar = (cx, cy, spikes, outerRadius, innerRadius, color, glowColor) => {
            let rot = Math.PI / 2 * 3;
            let x = cx, y = cy;
            const step = Math.PI / spikes;

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < spikes; i++) {
                x = cx + Math.cos(rot) * outerRadius;
                y = cy + Math.sin(rot) * outerRadius;
                ctx.lineTo(x, y);
                rot += step;

                x = cx + Math.cos(rot) * innerRadius;
                y = cy + Math.sin(rot) * innerRadius;
                ctx.lineTo(x, y);
                rot += step;
            }
            ctx.lineTo(cx, cy - outerRadius);
            ctx.closePath();
            
            ctx.fillStyle = color;
            if (glowColor) {
                ctx.shadowColor = glowColor;
                ctx.shadowBlur = 10;
            }
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#FFFFFF';
            ctx.stroke();
            ctx.restore();
        };

        for (let i = 0; i < 3; i++) {
            const isEarned = i < stars;
            const cx = w / 2 + (i - 1) * 26;
            const sy = cy + 25 + (i === 1 ? -4 : 0);
            const color = isEarned ? '#FFD700' : 'rgba(255,255,255,0.1)';
            const glow = isEarned ? '#FFD700' : null;
            
            ctx.save();
            ctx.translate(cx, sy);
            ctx.rotate((i - 1) * 0.2);
            drawStar(0, 0, 5, 10, 4.5, color, glow);
            ctx.restore();
        }

        // Reset ALL shadow state before restore
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.restore();

        // Nav arrows
        if (this.game.shop.getCurrentLevel() > 1)
            this._btn(ctx, 46, cy, 38, 38, '◀', '#1E3A5F', '#2A5288', 'prev');
        if (this.game.shop.getCurrentLevel() < this.game.shop.getHighestLevel())
            this._btn(ctx, w - 46, cy, 38, 38, '▶', '#1E3A5F', '#2A5288', 'next');
    }

    _drawMenuBottomRow(ctx, w, h, by) {
        const items = [
            { id: 'worldMap', icon: '🗺️', label: 'World', color: '#1E5F8E', light: '#2277BB' },
            { id: 'shop',     icon: '🛒', label: 'Shop',  color: '#5B3FA0', light: '#7B5FCC' },
            { id: 'leaderboard', icon: '🏆', label: 'Best', color: '#8B6914', light: '#C49A2A' },
            { id: 'settings', icon: '⚙️', label: 'Settings', color: '#334466', light: '#445588' },
        ];
        const bw = (w - 24) / 4 - 6;

        for (let i = 0; i < items.length; i++) {
            const it = items[i];
            const bx = 12 + i * (bw + 6) + bw / 2;
            this._drawIconTab(ctx, bx, by, bw, 64, it.icon, it.label, it.color, it.light, it.id);
        }
    }

    _drawIconTab(ctx, x, y, w, h, icon, label, c1, c2, id) {
        ctx.save();
        const r = 16;

        // Large soft shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.shadowColor = c1;
        ctx.shadowBlur = 15;
        ctx.beginPath(); ctx.roundRect(x - w/2, y - h/2 + 6, w, h, r); ctx.fill();
        ctx.shadowBlur = 0;

        // Darker Base
        ctx.fillStyle = c1;
        ctx.beginPath(); ctx.roundRect(x - w/2, y - h/2 + 4, w, h, r); ctx.fill();

        // Vibrant Body Gradient
        const g = ctx.createLinearGradient(x, y - h/2, x, y + h/2);
        g.addColorStop(0, c2); 
        g.addColorStop(1, c1);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.roundRect(x - w/2, y - h/2, w, h, r); ctx.fill();

        // Premium sweeping shine
        const shineG = ctx.createLinearGradient(x - w/2, y - h/2, x + w/2, y + h/2);
        const sweep = (this.t * 0.4 + (x * 0.005)) % 2;
        const pos = sweep - 0.4;
        const p0 = Math.max(0, Math.min(1, pos - 0.2));
        const p1 = Math.max(0, Math.min(1, pos));
        const p2 = Math.max(0, Math.min(1, pos + 0.2));
        shineG.addColorStop(p0, 'rgba(255,255,255,0)');
        shineG.addColorStop(p1, 'rgba(255,255,255,0.3)');
        shineG.addColorStop(p2, 'rgba(255,255,255,0)');
        ctx.fillStyle = shineG;
        ctx.beginPath(); ctx.roundRect(x - w/2 + 2, y - h/2 + 2, w - 4, h * 0.45, r - 2); ctx.fill();

        // Icon
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(icon, x, y - 8);

        // Label
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px "Outfit", sans-serif';
        ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 4;
        ctx.fillText(label, x, y + 16);

        ctx.restore();
        if (id) this._regBtn(x - w/2, y - h/2, w, h, id);
    }

    _drawMenuCoinBadge(ctx, w, by) {
        const coins = this.game.shop.getCoins();
        const bw = 160, bh = 44;
        const bx = (w - bw) / 2;

        ctx.save();
        // Drop shadow
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.shadowColor = 'rgba(255, 215, 0, 0.2)';
        ctx.shadowBlur = 15;
        ctx.beginPath(); ctx.roundRect(bx + 2, by + 4, bw, bh, bh / 2); ctx.fill();
        ctx.shadowBlur = 0;

        // Rich gold-green gradient background
        const g = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
        g.addColorStop(0, '#2A4A2A');
        g.addColorStop(1, '#0D1A0D');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, bh / 2); ctx.fill();

        // Glowing border
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, bh / 2); ctx.stroke();

        // 3D Coin icon
        const cx = bx + 24;
        const cy = by + bh / 2;
        ctx.fillStyle = '#B8860B';
        ctx.beginPath(); ctx.arc(cx, cy + 2, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFD700';
        ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFE066';
        ctx.font = '900 13px "Outfit", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('$', cx, cy + 1);

        // Coin value
        ctx.fillStyle = '#FFD700';
        ctx.font = '900 18px "Outfit", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 4;
        ctx.fillText(Utils.formatNumber(coins), bx + bw / 2 + 10, cy + 1);
        ctx.restore();
    }

    // ============================================================
    // WORLD MAP
    // ============================================================
    drawWorldMap(ctx) {
        this.activeButtons = [];
        const w = GC.W, h = GC.H;
        // Dark bg
        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, '#0A1628'); bg.addColorStop(1, '#0D2240');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

        // Header
        this._drawScreenHeader(ctx, w, '🗺️ WORLD MAP', '#00B4FF');

        const highest = this.game.shop.getHighestLevel();
        const cur = this.game.shop.getCurrentLevel();

        const themeGrads = {
            meadow:  ['#1B8C32', '#27A842'],
            city:    ['#2C3E50', '#3D5166'],
            desert:  ['#C47A35', '#D4935A'],
            volcano: ['#6B1A00', '#8B2A00'],
        };

        // Layout Constants
        const cardH = 102;
        const cardGap = 12;
        const cardStep = cardH + cardGap;
        const totalH = (typeof WORLDS !== 'undefined' ? WORLDS.length : 6) * cardStep;

        const btnW = 130;
        const btnH = 34;
        const btnX = w / 2;
        const btnY = h - 34;

        const contentY = 66;
        const contentH = h - contentY - 60;
        const maxScroll = Math.max(0, totalH - contentH + 16);
        this._wmScrollY = Math.max(0, Math.min(this._wmScrollY || 0, maxScroll));

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, contentY, w, contentH);
        ctx.clip();

        let yp = contentY - this._wmScrollY + 8;

        for (const world of (typeof WORLDS !== 'undefined' ? WORLDS : [])) {
            const unlocked = world.levels[0] <= highest;
            const [c1, c2] = themeGrads[world.theme] || ['#333', '#555'];

            ctx.save();

            // Card shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath(); ctx.roundRect(16, yp + 3, w - 32, cardH, 12); ctx.fill();

            // Card body
            const cg = ctx.createLinearGradient(16, yp, 16, yp + cardH);
            cg.addColorStop(0, unlocked ? c2 : '#222');
            cg.addColorStop(1, unlocked ? c1 : '#1A1A1A');
            ctx.fillStyle = cg;
            ctx.beginPath(); ctx.roundRect(16, yp, w - 32, cardH, 12); ctx.fill();

            // Shine
            ctx.fillStyle = 'rgba(255,255,255,0.07)';
            ctx.beginPath(); ctx.roundRect(16, yp, w - 32, cardH / 2, 12); ctx.fill();

            // World name
            ctx.fillStyle = unlocked ? '#FFF' : '#555';
            ctx.font = `bold 16px "Outfit", sans-serif`;
            ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            ctx.fillText(`${world.emoji}  ${world.name}`, 30, yp + 22);

            if (!unlocked) {
                ctx.fillStyle = '#888';
                ctx.font = '12px "Outfit", sans-serif';
                ctx.fillText('🔒 Complete previous world to unlock', 30, yp + 55);
            } else {
                // Level dots
                let dotX = 50;
                for (const lid of world.levels) {
                    const done = lid < highest;
                    const active = lid === cur;
                    const lev = LEVELS.find(l => l.id === lid);

                    // Dot shadow
                    ctx.fillStyle = 'rgba(0,0,0,0.3)';
                    ctx.beginPath(); ctx.arc(dotX + 1, yp + 61, 20, 0, Math.PI * 2); ctx.fill();

                    // Dot fill
                    const dotG = ctx.createRadialGradient(dotX - 4, yp + 55, 0, dotX, yp + 60, 22);
                    if (done) { dotG.addColorStop(0, '#4AFF9F'); dotG.addColorStop(1, '#00BB55'); }
                    else if (active) { dotG.addColorStop(0, '#7AD6FF'); dotG.addColorStop(1, '#00AAEE'); }
                    else { dotG.addColorStop(0, 'rgba(255,255,255,0.25)'); dotG.addColorStop(1, 'rgba(255,255,255,0.1)'); }
                    ctx.fillStyle = dotG;
                    ctx.beginPath(); ctx.arc(dotX, yp + 60, 20, 0, Math.PI * 2); ctx.fill();

                    if (active) {
                        ctx.strokeStyle = '#FFF'; ctx.lineWidth = 2.5;
                        ctx.beginPath(); ctx.arc(dotX, yp + 60, 22, 0, Math.PI * 2); ctx.stroke();
                    }

                    // Level number
                    ctx.fillStyle = done ? '#003322' : '#FFF';
                    ctx.font = 'bold 15px "Outfit", sans-serif';
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(lid, dotX, yp + 60);

                    // ONLY register buttons if they are inside the visible clipped content area!
                    const cardMid = yp + 60;
                    if (lid <= highest && cardMid > contentY && cardMid < contentY + contentH) {
                        this._regBtn(dotX - 22, yp + 60 - 22, 44, 44, `wm_play_${lid}`);
                    }

                    // Name below
                    ctx.fillStyle = 'rgba(255,255,255,0.6)';
                    ctx.font = '9px "Outfit", sans-serif';
                    ctx.fillText(lev ? lev.name : '', dotX, yp + 86);

                    dotX += 80;
                }
            }
            ctx.restore();
            yp += cardStep;
        }
        ctx.restore(); // unclip

        // Scroll indicator
        if (maxScroll > 0) {
            const trackH = contentH - 8;
            const thumbH = Math.max(30, trackH * (contentH / totalH));
            const thumbY = contentY + 4 + (this._wmScrollY / maxScroll) * (trackH - thumbH);
            ctx.fillStyle = 'rgba(0,180,255,0.5)';
            ctx.beginPath(); ctx.roundRect(w - 7, thumbY, 4, thumbH, 2); ctx.fill();
        }

        this._btn(ctx, btnX, btnY, btnW, btnH, '✕ Cancel', '#AA3333', '#CC4444', 'wmBack');
    }

    // ============================================================
    // SETTINGS
    // ============================================================
    drawSettings(ctx) {
        this.activeButtons = [];
        const w = GC.W, h = GC.H;
        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, '#0A1628'); bg.addColorStop(1, '#0D2240');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

        this._drawScreenHeader(ctx, w, '⚙️ SETTINGS', '#8899BB');

        const s = this.game.settings;
        let yp = 72;

        const row = (label, val, id1, lbl1, id2, lbl2, isToggle = false, toggleState = false) => {
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.roundRect(14, yp, w - 28, 52, 10); ctx.fill(); ctx.stroke();

            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 13px "Outfit", sans-serif';
            ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            ctx.fillText(label, 26, yp + 16);
            ctx.fillStyle = '#88AACC';
            ctx.font = '11px "Outfit", sans-serif';
            ctx.fillText(val, 26, yp + 37);

            if (isToggle) {
                // Render a premium sliding switch toggle
                const tx = w - 64, ty = yp + 14, tw = 46, th = 24, tr = th / 2;
                ctx.save();
                ctx.fillStyle = toggleState ? '#10B981' : '#374151'; // Green active, grey inactive
                ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, tr); ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.lineWidth = 1;
                ctx.stroke();

                // Slider knob
                const knobR = (th - 4) / 2;
                const knobX = toggleState ? (tx + tw - knobR - 2) : (tx + knobR + 2);
                const knobY = ty + th / 2;

                ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
                ctx.shadowBlur = 4;
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath(); ctx.arc(knobX, knobY, knobR, 0, Math.PI * 2); ctx.fill();
                ctx.restore();

                // Register button hit box for toggle action
                this._regBtn(tx, ty, tw, th, id1);
            } else if (id2) {
                this._btn(ctx, w - 95, yp + 26, 42, 26, lbl1, '#00AA55', '#00CC66', id1);
                this._btn(ctx, w - 46, yp + 26, 42, 26, lbl2, '#334466', '#445577', id2);
            } else if (id1) {
                this._btn(ctx, w - 54, yp + 26, 62, 26, lbl1, '#00AA55', '#00CC66', id1);
            }

            // Full row click target registration
            if (id1 && !isToggle) this._regBtn(14, yp, w - 28, 52, id1);

            yp += 62;
        };

        row('🔊 Sound', s.soundEnabled ? 'ON' : 'OFF', 'set_snd_toggle', s.soundEnabled ? 'Mute' : 'On', null, null, true, s.soundEnabled);
        row('🎮 Sensitivity', `${s.sensitivity.toFixed(1)}x`, 'set_sens_up', '+', 'set_sens_dn', '−', false, false);
        row('🖥️ Graphics', s.graphicsQuality.toUpperCase(), 'set_gfx_toggle', s.graphicsQuality === 'high' ? 'Low' : 'High', null, null, true, s.graphicsQuality === 'high');
        row('📋 Privacy Policy', 'Play Store Compliant', 'set_privacy', 'View', null, null, false, false);
        row('📜 Terms & Conditions', 'User Agreement', 'set_terms', 'View', null, null, false, false);
        row('⭐ Rate & Review', 'Support the Game!', 'set_rate', 'Rate', null, null, false, false);

        // Reset row
        ctx.fillStyle = 'rgba(255,50,50,0.08)';
        ctx.strokeStyle = 'rgba(255,50,50,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(14, yp, w - 28, 52, 10); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FF6666';
        ctx.font = 'bold 13px "Outfit", sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('🗑️ Reset Save Data', 26, yp + 16);
        ctx.fillStyle = '#886666';
        ctx.font = '11px "Outfit", sans-serif';
        ctx.fillText('Clears all coins, levels & upgrades', 26, yp + 37);
        this._btn(ctx, w - 54, yp + 26, 62, 26, 'RESET', '#882222', '#CC3333', 'set_reset');
        this._regBtn(14, yp, w - 28, 52, 'set_reset');

        this._btn(ctx, w / 2, h - 34, 130, 34, '← Back', '#334466', '#445577', 'settingsBack');
    }

    // ============================================================
    // PRIVACY POLICY & TERMS MODALS
    // ============================================================
    drawPrivacyPolicy(ctx) {
        this.activeButtons = [];
        const w = GC.W, h = GC.H;
        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, '#0A1628'); bg.addColorStop(1, '#0D2240');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

        this._drawScreenHeader(ctx, w, '📋 PRIVACY POLICY', '#00C8FF');

        const boxX = 14, boxY = 65, boxW = w - 28, boxH = h - 115;
        ctx.fillStyle = 'rgba(10, 20, 40, 0.75)';
        ctx.strokeStyle = 'rgba(0, 200, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(boxX, boxY, boxW, boxH, 12); ctx.fill(); ctx.stroke();

        const textLines = [
            "PRIVACY POLICY — CROWD RUSH",
            "Effective Date: July 2026",
            "",
            "1. INFORMATION WE COLLECT",
            "Crowd Rush does not collect personal identifiers.",
            "Game progress, coins, and high scores are saved",
            "locally on your device storage.",
            "",
            "2. ADVERTISING & ANALYTICS",
            "Third-party ad networks (Google AdMob) may use",
            "anonymized identifiers to serve tailored ads.",
            "",
            "3. DATA SECURITY & STORAGE",
            "Your save data remains local to your device.",
            "Uninstalling the app clears local saved data.",
            "",
            "4. CONTACT & SUPPORT",
            "For inquiries, contact: skyyforge07@gmail.com"
        ];

        let lineY = boxY + 14;
        for (const line of textLines) {
            if (line.startsWith("PRIVACY POLICY") || line.startsWith("1.") || line.startsWith("2.") || line.startsWith("3.") || line.startsWith("4.")) {
                ctx.fillStyle = '#00C8FF';
                ctx.font = 'bold 12px "Outfit", sans-serif';
            } else {
                ctx.fillStyle = '#AAC8EE';
                ctx.font = '11px "Outfit", sans-serif';
            }
            ctx.textAlign = 'left'; ctx.textBaseline = 'top';
            ctx.fillText(line, boxX + 16, lineY);
            lineY += 18;
        }

        this._btn(ctx, w / 2, h - 30, 130, 32, '← Back', '#334466', '#445577', 'privacyBack');
    }

    drawTerms(ctx) {
        this.activeButtons = [];
        const w = GC.W, h = GC.H;
        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, '#0A1628'); bg.addColorStop(1, '#0D2240');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

        this._drawScreenHeader(ctx, w, '📜 TERMS & CONDITIONS', '#FFC800');

        const boxX = 14, boxY = 65, boxW = w - 28, boxH = h - 115;
        ctx.fillStyle = 'rgba(10, 20, 40, 0.75)';
        ctx.strokeStyle = 'rgba(255, 200, 0, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(boxX, boxY, boxW, boxH, 12); ctx.fill(); ctx.stroke();

        const textLines = [
            "TERMS AND CONDITIONS",
            "Last Updated: July 2026",
            "",
            "1. ACCEPTANCE OF TERMS",
            "By playing Crowd Rush, you agree to these terms.",
            "",
            "2. INTELLECTUAL PROPERTY",
            "All artwork, code, sound effects, and gameplay",
            "mechanics are property of Crowd Rush Games.",
            "",
            "3. IN-GAME VIRTUAL ITEMS",
            "Coins and unlocked skins are non-transferable",
            "virtual items with no real monetary value.",
            "",
            "4. LIMITATION OF LIABILITY",
            "Crowd Rush is provided 'as is' without warranty.",
            "",
            "5. CONTACT",
            "For inquiries, contact: skyyforge07@gmail.com"
        ];

        let lineY = boxY + 14;
        for (const line of textLines) {
            if (line.startsWith("TERMS AND CONDITIONS") || line.startsWith("1.") || line.startsWith("2.") || line.startsWith("3.") || line.startsWith("4.")) {
                ctx.fillStyle = '#FFC800';
                ctx.font = 'bold 12px "Outfit", sans-serif';
            } else {
                ctx.fillStyle = '#AAC8EE';
                ctx.font = '11px "Outfit", sans-serif';
            }
            ctx.textAlign = 'left'; ctx.textBaseline = 'top';
            ctx.fillText(line, boxX + 16, lineY);
            lineY += 20;
        }

        this._btn(ctx, w / 2, h - 30, 130, 32, '← Back', '#334466', '#445577', 'termsBack');
    }

    // ============================================================
    // LEADERBOARD
    // ============================================================
    drawLeaderboard(ctx) {
        this.activeButtons = [];
        const w = GC.W, h = GC.H;
        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, '#0A1628'); bg.addColorStop(1, '#0D2240');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

        this._drawScreenHeader(ctx, w, '🏆 BEST RUNS', '#FFD700');

        const runs = this.game.shop.getBestRuns();
        if (runs.length === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '14px "Outfit", sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('No runs yet — complete a level!', w / 2, h / 2);
        } else {
            let yp = 72;
            const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
            runs.forEach((run, i) => {
                const lvl = LEVELS.find(l => l.id === run.level);
                const isTop = i < 3;

                ctx.save();
                ctx.fillStyle = isTop
                    ? `rgba(${['255,215,0','192,192,192','205,127,50'][i]},0.08)`
                    : 'rgba(255,255,255,0.04)';
                ctx.strokeStyle = isTop ? `rgba(${['255,215,0','192,192,192','205,127,50'][i]},0.2)` : 'rgba(255,255,255,0.06)';
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.roundRect(14, yp, w - 28, 50, 10); ctx.fill(); ctx.stroke();

                // Medal
                if (isTop) {
                    ctx.fillStyle = medalColors[i];
                    ctx.font = '18px sans-serif';
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(['🥇','🥈','🥉'][i], 30, yp + 25);
                } else {
                    ctx.fillStyle = '#667';
                    ctx.font = 'bold 12px "Outfit", sans-serif';
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(`#${i+1}`, 30, yp + 25);
                }

                ctx.fillStyle = isTop ? medalColors[i] : '#DDD';
                ctx.font = 'bold 12px "Outfit", sans-serif';
                ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
                ctx.fillText(`Lv.${run.level} — ${lvl ? lvl.name : '?'}`, 48, yp + 15);

                ctx.fillStyle = '#99BBDD';
                ctx.font = '11px "Outfit", sans-serif';
                ctx.fillText(`👥 ${run.crowd}  💥 ${run.damage}  🪙 ${run.coins}`, 48, yp + 36);

                ctx.restore();
                yp += 56;
            });
        }

        const total = this.game.shop.getTotalCoinsEarned();
        ctx.fillStyle = '#667788';
        ctx.font = '11px "Outfit", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`Total coins earned: 🪙 ${total}`, w / 2, h - 64);

        this._btn(ctx, w / 2, h - 34, 130, 34, '← Back', '#334466', '#445577', 'lbBack');
    }

    // ============================================================
    // GAME OVER
    // ============================================================
    drawGameOver(ctx) {
        this.activeButtons = [];
        const w = GC.W, h = GC.H;

        // Dark overlay
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, w, h);

        // Animated skull
        const sk = 1 + Math.sin(this.t * 3) * 0.04;
        ctx.save();
        ctx.translate(w / 2, h * 0.32);
        ctx.scale(sk, sk);

        // Red glow circle
        const glow = ctx.createRadialGradient(0, 0, 10, 0, 0, 80);
        glow.addColorStop(0, 'rgba(255,50,0,0.25)');
        glow.addColorStop(1, 'rgba(255,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(0, 0, 80, 0, Math.PI * 2); ctx.fill();

        ctx.font = '62px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('💀', 0, 0);
        ctx.restore();

        // GAME OVER text
        ctx.fillStyle = '#FF4444';
        ctx.font = 'bold 40px "Outfit", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = '#FF0000'; ctx.shadowBlur = 20;
        ctx.fillText('GAME OVER', w / 2, h * 0.16);
        ctx.shadowBlur = 0;

        // Sub message
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '13px "Outfit", sans-serif';
        ctx.fillText('Your crowd was defeated!', w / 2, h * 0.44);

        // Buttons
        this._btn(ctx, w / 2, h * 0.56, 220, 52, '📺  Revive (Watch Ad)', '#DD7700', '#FF9900', 'revive');
        this._btn(ctx, w / 2, h * 0.66, 180, 46, '🔄  Retry', '#00AA55', '#00CC66', 'retry');
        this._btn(ctx, w / 2, h * 0.76, 150, 40, '🏠  Menu', '#334466', '#445577', 'menu');
    }

    // ============================================================
    // RESULTS
    // ============================================================
    drawResults(ctx) {
        this.activeButtons = [];
        const w = GC.W, h = GC.H;

        // Deep purple to midnight blue translucent background
        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, 'rgba(20, 10, 40, 0.85)'); bg.addColorStop(1, 'rgba(10, 20, 40, 0.95)');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

        // Neon floating particles
        for (let i = 0; i < 30; i++) {
            const px = ((i * 137 + this.t * 30) % w);
            const py = ((i * 89 - this.t * 40 + h * 10) % h); // Float upwards
            ctx.save();
            ctx.globalAlpha = 0.4 + Math.sin(i + this.t * 3) * 0.4;
            ctx.fillStyle = ['#00FFFF', '#FF00FF', '#00FF88', '#FFD700'][i % 4];
            
            ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 10;
            ctx.translate(px, py);
            ctx.rotate(this.t * (i % 2 === 0 ? 2 : -2) + i);
            ctx.fillRect(-3, -3, 6, 6);
            ctx.restore();
        }

        // Header
        const bounce = 1 + Math.sin(this.t * 4) * 0.04;
        ctx.save();
        ctx.translate(w / 2, h * 0.12);
        ctx.scale(bounce, bounce);
        ctx.fillStyle = '#00FFFF';
        ctx.font = '900 36px "Outfit", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = '#00FFFF'; ctx.shadowBlur = 25;
        ctx.fillText('MISSION COMPLETE', 0, 0);
        ctx.restore();

        // Stats card
        if (this.resultData) {
            const d = this.resultData;
            const formatNumber = (num) => {
                if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
                if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
                if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
                return num.toString();
            };

            const cardX = w * 0.05;
            const cardW = w * 0.9;
            const cardY = h * 0.32;
            const cardH = 195;

            ctx.save();
            ctx.shadowColor = 'rgba(0,255,255,0.3)';
            ctx.shadowBlur = 30;
            
            const cardBg = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
            cardBg.addColorStop(0, 'rgba(40, 20, 80, 0.6)');
            cardBg.addColorStop(1, 'rgba(20, 30, 70, 0.6)');
            
            ctx.fillStyle = cardBg;
            ctx.strokeStyle = 'rgba(0,255,255,0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.roundRect(cardX, cardY, cardW, cardH, 20); 
            ctx.fill(); ctx.stroke();
            ctx.restore();

            const sy = cardY + 35;
            const sg = 40;

            const stat = (icon, label, val, color, row) => {
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.font = '14px "Outfit", sans-serif';
                ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
                ctx.fillText(`${icon}  ${label}`, cardX + 20, sy + row * sg);

                ctx.fillStyle = color;
                ctx.font = 'bold 18px "Outfit", sans-serif';
                ctx.textAlign = 'right';
                ctx.shadowColor = color;
                ctx.shadowBlur = 10;
                ctx.fillText(val, cardX + cardW - 20, sy + row * sg);
                ctx.shadowBlur = 0;
            };

            stat('👥', 'Crowd Remaining', formatNumber(d.crowdRemaining), '#00FFFF', 0);
            stat('💥', 'Fortress Damage', formatNumber(d.damageDealt), '#FF3366', 1);
            stat('🪙', 'Coins Earned', `+${formatNumber(d.coinsEarned)}`, '#FFD700', 2);

            // Custom Star Drawing
            const drawStar = (cx, cy, spikes, outerRadius, innerRadius, color, glowColor) => {
                let rot = Math.PI / 2 * 3;
                let x = cx, y = cy;
                const step = Math.PI / spikes;

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(cx, cy - outerRadius);
                for (let i = 0; i < spikes; i++) {
                    x = cx + Math.cos(rot) * outerRadius;
                    y = cy + Math.sin(rot) * outerRadius;
                    ctx.lineTo(x, y);
                    rot += step;

                    x = cx + Math.cos(rot) * innerRadius;
                    y = cy + Math.sin(rot) * innerRadius;
                    ctx.lineTo(x, y);
                    rot += step;
                }
                ctx.lineTo(cx, cy - outerRadius);
                ctx.closePath();
                
                ctx.fillStyle = color;
                if (glowColor) {
                    ctx.shadowColor = glowColor;
                    ctx.shadowBlur = 15;
                }
                ctx.fill();
                
                // Inner bright stroke
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#FFFFFF';
                ctx.stroke();
                ctx.restore();
            };

            // Stars
            const stars = d.crowdRemaining > 50 ? 3 : d.crowdRemaining > 20 ? 2 : 1;
            const starSpacing = 60;
            const starY = cardY + cardH - 35;
            
            for (let i = 0; i < 3; i++) {
                const cx = w / 2 + (i - 1) * starSpacing;
                // Center star is slightly raised
                const cy = starY + (i === 1 ? -10 : 0);
                const isEarned = i < stars;
                const outR = isEarned ? 22 : 18;
                const inR = isEarned ? 10 : 8;
                const color = isEarned ? '#FFD700' : 'rgba(255, 255, 255, 0.15)';
                const glow = isEarned ? '#FFD700' : null;
                
                // Tilt the left and right stars slightly for dynamic look
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate((i - 1) * 0.2);
                drawStar(0, 0, 5, outR, inR, color, glow);
                ctx.restore();
            }
        }

        // Display Daily Reward text if present
        if (this.game.dailyRewardText) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 12px "Outfit", sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(this.game.dailyRewardText, w / 2, h * 0.58);
        }

        if (!this.rewarded2x) {
            this._btn(ctx, w / 2, h * 0.65, 180, 44, '📺 2x Coins (Ad)', '#CC6600', '#FF8800', 'ad_2x');
        } else {
            this._btn(ctx, w / 2, h * 0.65, 180, 44, '✅ Coins Doubled!', '#444', '#666', 'none');
        }

        const isDaily = this.game.currentLevel && this.game.currentLevel.isDaily;
        if (!isDaily && this.game.shop.getCurrentLevel() < LEVELS.length) {
            this._btn(ctx, w / 2, h * 0.76, 200, 52, '▶  Next Level', '#0088CC', '#00DDFF', 'nextLevelR');
        }
        this._btn(ctx, w / 2, h * 0.86, 150, 40, '🏠  Menu', '#442266', '#7744AA', 'menuR');
    }

    // ============================================================
    // SHOP
    // ============================================================
    drawShop(ctx) {
        this.activeButtons = [];
        const w = GC.W, h = GC.H;
        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, '#0A1628'); bg.addColorStop(1, '#150A28');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

        this._drawScreenHeader(ctx, w, '\ud83d\udecd\ufe0f SHOP', '#C084FC');

        // Coin badge
        ctx.save();
        const cg = ctx.createLinearGradient(w/2 - 80, 52, w/2 + 80, 52);
        cg.addColorStop(0, '#1A3A1A'); cg.addColorStop(1, '#2A4A2A');
        ctx.fillStyle = cg;
        ctx.beginPath(); ctx.roundRect(w/2 - 85, 44, 170, 24, 12); ctx.fill();
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 13px "Outfit", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`\ud83e\ude99 ${Math.floor(this.game.shop.getCoins()).toLocaleString()} coins`, w/2, 56);
        ctx.restore();

        // Free coins ad button
        this._btn(ctx, w - 46, 56, 74, 24, '\ud83d\udcfa +500', '#DD7700', '#FF9900', 'ad_shop');

        // Tab row
        const tabY = 80;
        const tabW = (w - 32) / 2;
        const tabs = [
            { id: 'shopTab_upgrades', label: '\u26a1 Upgrades', active: this._shopTab === 'upgrades' },
            { id: 'shopTab_skins',    label: '\ud83c\udfa8 Skins',    active: this._shopTab === 'skins'    },
        ];
        tabs.forEach((tab, i) => {
            const tx = 16 + i * (tabW + 4) + tabW / 2;
            ctx.save();
            if (tab.active) {
                const tg = ctx.createLinearGradient(tx - tabW/2, tabY, tx + tabW/2, tabY);
                tg.addColorStop(0, '#2563EB'); tg.addColorStop(1, '#7C3AED');
                ctx.fillStyle = tg;
                ctx.shadowColor = '#7C3AED'; ctx.shadowBlur = 8;
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.06)';
            }
            ctx.strokeStyle = tab.active ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.roundRect(tx - tabW/2, tabY - 14, tabW, 30, 8); ctx.fill(); ctx.stroke();
            ctx.restore();
            ctx.fillStyle = tab.active ? '#FFF' : 'rgba(255,255,255,0.5)';
            ctx.font = `bold ${tab.active ? 12 : 11}px "Outfit", sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(tab.label, tx, tabY);
            this._regBtn(tx - tabW/2, tabY - 14, tabW, 30, tab.id);
        });

        // Clip content area
        const contentY = 104;
        const contentH = h - contentY - 52;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, contentY, w, contentH);
        ctx.clip();

        if (this._shopTab === 'upgrades') {
            // --- UPGRADES TAB ---
            const ups = [
                { key: 'speed',         icon: '\u26a1', name: 'Run Speed',      desc: 'Move faster down the lane' },
                { key: 'startCrowd',    icon: '\ud83d\udc65', name: 'Start Crowd',    desc: 'More soldiers at start (+15)' },
                { key: 'gateMagnet',    icon: '\ud83e\uddcf', name: 'Gate Magnet',    desc: 'Auto-steer to best gate' },
                { key: 'feverDuration', icon: '\ud83d\udd25', name: 'Fever Duration', desc: 'Extends Hyper Rush duration' },
                { key: 'coinMagnet',    icon: '\ud83d\udc8e', name: 'Coin Magnet',    desc: 'Attracts bonus rewards' },
            ];
            let yp = contentY + 8;
            for (const u of ups) {
                const lv = this.game.shop.getUpgradeLevel(u.key);
                const cost = this.game.shop.getUpgradeCost(u.key);
                this._drawUpgradeRow(ctx, w, yp, u, lv, cost);
                yp += 62;
            }

        } else {
            // --- SKINS TAB ---
            const skinKeys = Object.keys(CROWD_SKINS);
            const totalH = skinKeys.length * 72;
            const maxScroll = Math.max(0, totalH - contentH + 8);
            this._shopScrollY = Math.max(0, Math.min(this._shopScrollY, maxScroll));

            let yp = contentY - this._shopScrollY + 8;
            for (const k of skinKeys) {
                const skin = CROWD_SKINS[k];
                const owned = this.game.shop.isSkinUnlocked(k);
                const sel   = this.game.shop.getCurrentSkin() === k;
                this._drawSkinCard(ctx, w, yp, k, skin, owned, sel);
                yp += 72;
            }

            // Scroll indicator
            if (maxScroll > 0) {
                const trackH = contentH - 8;
                const thumbH = Math.max(30, trackH * (contentH / totalH));
                const thumbY = contentY + 4 + (this._shopScrollY / maxScroll) * (trackH - thumbH);
                ctx.fillStyle = 'rgba(124,58,237,0.5)';
                ctx.beginPath(); ctx.roundRect(w - 7, thumbY, 4, thumbH, 2); ctx.fill();
            }
        }

        ctx.restore(); // un-clip

        this._btn(ctx, w / 2, h - 28, 130, 36, '\u2190 Back', '#334466', '#445577', 'shopBack');
    }

    _drawSkinCard(ctx, w, y, k, skin, owned, sel) {
        const cardH = 66;
        ctx.save();

        // Card background with glow for selected
        if (sel) {
            ctx.shadowColor = '#00B4FF'; ctx.shadowBlur = 14;
        }
        // Premium tiers
        const isPremium = skin.cost >= 75000;
        const isLegendary = skin.cost >= 150000;
        let cardBg;
        if (isLegendary) {
            cardBg = ctx.createLinearGradient(14, y, w - 14, y + cardH);
            cardBg.addColorStop(0, '#1a0030'); cardBg.addColorStop(0.5, '#2d0050'); cardBg.addColorStop(1, '#0d0015');
        } else if (isPremium) {
            cardBg = ctx.createLinearGradient(14, y, w - 14, y + cardH);
            cardBg.addColorStop(0, '#0d1a00'); cardBg.addColorStop(0.5, '#1a2800'); cardBg.addColorStop(1, '#1a1a2e');
        } else {
            cardBg = sel ? 'rgba(0,180,255,0.12)' : 'rgba(255,255,255,0.04)';
        }
        ctx.fillStyle = cardBg;
        let borderColor;
        if (isLegendary)    borderColor = sel ? 'rgba(170,0,255,0.9)' : 'rgba(170,0,255,0.4)';
        else if (isPremium) borderColor = sel ? 'rgba(255,80,0,0.8)'  : 'rgba(255,80,0,0.3)';
        else                borderColor = sel ? 'rgba(0,200,255,0.6)'  : 'rgba(255,255,255,0.08)';
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = sel ? 1.5 : 1;
        ctx.beginPath(); ctx.roundRect(14, y + 2, w - 28, cardH, 12); ctx.fill(); ctx.stroke();
        ctx.shadowBlur = 0;

        // Tier badge
        if (isLegendary) {
            ctx.fillStyle = '#CC00FF'; ctx.font = 'bold 8px "Outfit", sans-serif';
            ctx.textAlign = 'left'; ctx.textBaseline = 'top';
            ctx.fillText('LEGENDARY', 22, y + 6);
        } else if (isPremium) {
            ctx.fillStyle = '#FF6600'; ctx.font = 'bold 8px "Outfit", sans-serif';
            ctx.textAlign = 'left'; ctx.textBaseline = 'top';
            ctx.fillText('PREMIUM', 22, y + 6);
        }

        // Skin color preview swatch
        if (skin.body === 'rainbow') {
            const rg = ctx.createLinearGradient(28, y + 16, 52, y + 52);
            rg.addColorStop(0, '#F00'); rg.addColorStop(0.33, '#0F0'); rg.addColorStop(0.66, '#00F'); rg.addColorStop(1, '#F0F');
            ctx.fillStyle = rg;
        } else {
            ctx.fillStyle = skin.body;
        }
        ctx.beginPath(); ctx.arc(40, y + cardH/2 + 2, 16, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = isLegendary ? 'rgba(204,0,255,0.8)' : isPremium ? 'rgba(255,102,0,0.8)' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(40, y + cardH/2 + 2, 16, 0, Math.PI * 2); ctx.stroke();

        // Skin name
        ctx.fillStyle = sel ? '#00DDFF' : isLegendary ? '#CC00FF' : isPremium ? '#FF8800' : '#FFF';
        ctx.font = `bold 12px "Outfit", sans-serif`;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(skin.name, 64, y + cardH/2 - 4);

        // Cost hint for locked
        if (!owned) {
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '9px "Outfit", sans-serif';
            ctx.fillText(`\ud83e\ude99 ${skin.cost.toLocaleString()} coins`, 64, y + cardH/2 + 12);
        }

        // Action button (right side)
        if (sel) {
            ctx.fillStyle = '#00DDFF'; ctx.font = 'bold 9px "Outfit", sans-serif';
            ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
            ctx.fillText('\u2714 EQUIPPED', w - 20, y + cardH/2 + 2);
        } else if (owned) {
            this._btn(ctx, w - 46, y + cardH/2 + 2, 58, 26, 'Equip', '#007799', '#0099CC', `sel_${k}`);
        } else {
            const ca = this.game.shop.getCoins() >= skin.cost;
            const btnColor = isLegendary ? (ca ? '#6600AA' : '#222') : isPremium ? (ca ? '#884400' : '#222') : (ca ? '#886600' : '#333');
            const btnLight  = isLegendary ? (ca ? '#9900FF' : '#333') : isPremium ? (ca ? '#CC6600' : '#444') : (ca ? '#CCAA00' : '#444');
            this._btn(ctx, w - 50, y + cardH/2 + 2, 72, 26, `\ud83e\ude99 ${skin.cost >= 1000 ? (skin.cost/1000).toFixed(0)+'K' : skin.cost}`,
                btnColor, btnLight, `buys_${k}`);
        }
        ctx.restore();
    }

    _drawSectionLabel(ctx, w, y, text, color) {
        ctx.fillStyle = color;
        ctx.font = 'bold 12px "Outfit", sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(text, 18, y);
        ctx.strokeStyle = `${color}44`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(18 + ctx.measureText(text).width + 8, y); ctx.lineTo(w - 18, y); ctx.stroke();
    }

    _drawUpgradeRow(ctx, w, y, u, lv, cost) {
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(14, y, w - 28, 52, 10); ctx.fill(); ctx.stroke();

        // Icon circle
        ctx.fillStyle = '#1E3A5F';
        ctx.beginPath(); ctx.arc(38, y + 26, 16, 0, Math.PI * 2); ctx.fill();
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(u.icon, 38, y + 26);

        // Name + desc
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 12px "Outfit", sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(u.name, 62, y + 18);
        ctx.fillStyle = '#8899BB';
        ctx.font = '10px "Outfit", sans-serif';
        ctx.fillText(u.desc, 62, y + 35);

        // Glowing level pip dots
        for (let i = 0; i < 3; i++) {
            ctx.save();
            if (i < lv) {
                ctx.shadowColor = '#00FF88';
                ctx.shadowBlur = 6;
                ctx.fillStyle = '#00FF88';
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
            }
            ctx.beginPath(); ctx.arc(62 + i * 13, y + 46, 4, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }

        // Buy button
        if (!cost) {
            ctx.fillStyle = '#00FF88';
            ctx.font = 'bold 10px "Outfit", sans-serif';
            ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
            ctx.fillText('MAX ✓', w - 22, y + 26);
        } else {
            const canAfford = this.game.shop.getCoins() >= cost;
            this._btn(ctx, w - 54, y + 26, 70, 28, `🪙 ${cost}`,
                canAfford ? '#007733' : '#333', canAfford ? '#00CC55' : '#444', `buy_${u.key}`);
        }
        ctx.restore();
    }

    _drawSkinRow(ctx, w, y, k, skin, owned, sel) {
        ctx.save();
        if (sel) {
            ctx.shadowColor = '#00B4FF';
            ctx.shadowBlur = 8;
        }
        ctx.fillStyle = sel ? 'rgba(0,180,255,0.12)' : 'rgba(255,255,255,0.04)';
        ctx.strokeStyle = sel ? 'rgba(0,200,255,0.6)' : 'rgba(255,255,255,0.08)';
        ctx.lineWidth = sel ? 1.5 : 1;
        ctx.beginPath(); ctx.roundRect(14, y, w - 28, 42, 9); ctx.fill(); ctx.stroke();
        if (sel) {
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
        }

        // Skin color circle
        if (skin.body === 'rainbow') {
            const rg = ctx.createLinearGradient(28, y + 10, 44, y + 32);
            rg.addColorStop(0, '#F00'); rg.addColorStop(0.33, '#0F0'); rg.addColorStop(0.66, '#00F'); rg.addColorStop(1, '#F0F');
            ctx.fillStyle = rg;
        } else { ctx.fillStyle = skin.body; }
        ctx.beginPath(); ctx.arc(36, y + 21, 12, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(36, y + 21, 12, 0, Math.PI * 2); ctx.stroke();

        // Name
        ctx.fillStyle = sel ? '#00DDFF' : '#FFF';
        ctx.font = `bold 12px "Outfit", sans-serif`;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(skin.name, 56, y + 21);

        // Equipped / Select / Buy
        if (sel) {
            ctx.fillStyle = '#00DDFF';
            ctx.font = 'bold 10px "Outfit", sans-serif';
            ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
            ctx.fillText('✓ EQUIPPED', w - 20, y + 21);
        } else if (owned) {
            this._btn(ctx, w - 46, y + 21, 58, 24, 'Select', '#007799', '#0099CC', `sel_${k}`);
        } else {
            const ca = this.game.shop.getCoins() >= skin.cost;
            this._btn(ctx, w - 46, y + 21, 70, 24, `🪙 ${skin.cost}`,
                ca ? '#886600' : '#333', ca ? '#CCAA00' : '#444', `buys_${k}`);
        }
        ctx.restore();
    }

    // ============================================================
    // SCREEN HEADER helper
    // ============================================================
    _drawScreenHeader(ctx, w, title, color) {
        // Underline bar
        ctx.fillStyle = `${color}33`;
        ctx.beginPath(); ctx.roundRect(0, 44, w, 2, 1); ctx.fill();

        ctx.fillStyle = color;
        ctx.font = 'bold 22px "Outfit", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = color; ctx.shadowBlur = 14;
        ctx.fillText(title, w / 2, 27);
        ctx.shadowBlur = 0;
    }

    // ============================================================
    // CLICK HANDLING
    // ============================================================
    getButtons() {
        if (this.activeButtons && this.activeButtons.length > 0) {
            return this.activeButtons;
        }
        return this._getStaticButtons();
    }

    _getStaticButtons() {
        const w = GC.W, h = GC.H, btns = [];
        if (this.game.state === 'MENU') {
            if (this.showingShop) {
                btns.push({ x: w/2-65, y: h-46, w: 130, h: 36, id: 'shopBack' });
                btns.push({ x: w-83, y: 44, w: 74, h: 24, id: 'ad_shop' });
                // Tab buttons (always present)
                const tabW = (w - 32) / 2;
                btns.push({ x: 16,         y: 66, w: tabW, h: 30, id: 'shopTab_upgrades' });
                btns.push({ x: 16+tabW+4,  y: 66, w: tabW, h: 30, id: 'shopTab_skins' });

                if (this._shopTab === 'upgrades') {
                    const ups = ['speed','startCrowd','gateMagnet','feverDuration','coinMagnet'];
                    let yp = 112;
                    for (const k of ups) {
                        if (this.game.shop.getUpgradeCost(k)) btns.push({ x: w-89, y: yp+16, w: 70, h: 28, id: `buy_${k}` });
                        yp += 62;
                    }
                } else {
                    const contentY = 104, contentH = h - contentY - 52;
                    let yp = contentY - this._shopScrollY + 8;
                    for (const k of Object.keys(CROWD_SKINS)) {
                        const owned = this.game.shop.isSkinUnlocked(k);
                        const sel   = this.game.shop.getCurrentSkin() === k;
                        const cardMid = yp + 33 + 2;
                        if (!sel && cardMid > contentY && cardMid < contentY + contentH) {
                            btns.push({ x: w - 86, y: cardMid - 13, w: 72, h: 26, id: owned ? `sel_${k}` : `buys_${k}` });
                        }
                        yp += 72;
                    }
                }
            } else if (this.showingWorldMap) {
                const btnW = 130;
                const btnH = 34;
                const btnX = w / 2;
                const btnY = h - 34;
                btns.push({ x: btnX - btnW/2, y: btnY - btnH/2, w: btnW, h: btnH, id: 'wmBack' });

                const cardH = 102;
                const cardGap = 12;
                const cardStep = cardH + cardGap;

                const contentY = 66;
                const contentH = h - contentY - 60;
                let yp = contentY - (this._wmScrollY || 0) + 8;
                for (const world of (typeof WORLDS !== 'undefined' ? WORLDS : [])) {
                    const highest = this.game.shop.getHighestLevel();
                    if (world.levels[0] <= highest) {
                        let dotX = 50;
                        for (const lid of world.levels) {
                            const cardMid = yp + 60;
                            if (lid <= highest && cardMid > contentY && cardMid < contentY + contentH) {
                                btns.push({ x: dotX - 25, y: yp + 60 - 25, w: 50, h: 50, id: `wm_play_${lid}` });
                            }
                            dotX += 80;
                        }
                    }
                    yp += cardStep;
                }
            } else if (this.showingPrivacyPolicy) {
                btns.push({ x: w/2-65, y: h-46, w: 130, h: 32, id: 'privacyBack' });
            } else if (this.showingTerms) {
                btns.push({ x: w/2-65, y: h-46, w: 130, h: 32, id: 'termsBack' });
            } else if (this.showingSettings) {
                btns.push({ x: w/2-65, y: h-51, w: 130, h: 34, id: 'settingsBack' });
                btns.push({ x: 14, y: 72, w: w - 28, h: 52, id: 'set_snd_toggle' });
                btns.push({ x: w-116, y: 147, w: 42, h: 26, id: 'set_sens_up' });
                btns.push({ x: w-67, y: 147, w: 42, h: 26, id: 'set_sens_dn' });
                btns.push({ x: 14, y: 196, w: w - 28, h: 52, id: 'set_gfx_toggle' });
                btns.push({ x: 14, y: 258, w: w - 28, h: 52, id: 'set_privacy' });
                btns.push({ x: 14, y: 320, w: w - 28, h: 52, id: 'set_terms' });
                btns.push({ x: 14, y: 382, w: w - 28, h: 52, id: 'set_rate' });
                btns.push({ x: 14, y: 444, w: w - 28, h: 52, id: 'set_reset' });
            } else if (this.showingLeaderboard) {
                btns.push({ x: w/2-65, y: h-51, w: 130, h: 34, id: 'lbBack' });
            } else {
                btns.push({ x: w/2-100, y: h*0.52-29, w: 200, h: 58, id: 'play' });
                const by2 = h * 0.64;
                const bw = (w - 24) / 4 - 6;
                ['worldMap','shop','leaderboard','settings'].forEach((id, i) => {
                    btns.push({ x: 12 + i * (bw + 6), y: by2 - 32, w: bw, h: 64, id });
                });
                const cy = h * 0.37;
                if (this.game.shop.getCurrentLevel() > 1) btns.push({ x: 28, y: cy - 18, w: 36, h: 36, id: 'prev' });
                if (this.game.shop.getCurrentLevel() < this.game.shop.getHighestLevel()) btns.push({ x: w - 64, y: cy - 18, w: 36, h: 36, id: 'next' });
            }
        }
        if (this.game.state === 'GAME_OVER') {
            btns.push({ x: w/2-110, y: h*0.56-26, w: 220, h: 52, id: 'revive' });
            btns.push({ x: w/2-90, y: h*0.66-23, w: 180, h: 46, id: 'retry' });
            btns.push({ x: w/2-75, y: h*0.76-20, w: 150, h: 40, id: 'menu' });
        }
        if (this.game.state === 'RESULTS') {
            if (!this.rewarded2x) {
                btns.push({ x: w/2-90, y: h*0.65-22, w: 180, h: 44, id: 'ad_2x' });
            }
            if (this.game.shop.getCurrentLevel() < LEVELS.length) btns.push({ x: w/2-100, y: h*0.76-26, w: 200, h: 52, id: 'nextLevelR' });
            btns.push({ x: w/2-75, y: h*0.86-20, w: 150, h: 40, id: 'menuR' });
        }
        // Exit button during gameplay
        if (['PLAYING','CLASH','FORTRESS_ATTACK'].includes(this.game.state)) {
            btns.push({ x: 6, y: 0, w: 40, h: 40, id: 'exitToMenu' });
        }
        if (this.game.state === 'STORY_INTRO') {
            btns.push({ x: w/2 - 90, y: h * 0.76 - 25, w: 180, h: 50, id: 'startStory' });
        }
        return btns;
    }

    handleClick(x, y) {
        for (const b of this.getButtons()) {
            if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
                this._onBtn(b.id); return true;
            }
        }
        return false;
    }

    _onBtn(id) {
        const s = this.game.settings;
        switch(id) {
            case 'shopTab_upgrades': this._shopTab = 'upgrades'; break;
            case 'shopTab_skins':    this._shopTab = 'skins';    break;
            case 'daily_level': {
                const dailyLevel = this.game.generateDailyLevel();
                this.game.startLevel(dailyLevel);
            } break;
            case 'play': this.game.startLevel(this.game.shop.getCurrentLevel()); break;
            case 'shop': this.showingShop = true; this.showingWorldMap = false; this.showingSettings = false; this.showingLeaderboard = false; this.showingPrivacyPolicy = false; this.showingTerms = false; break;
            case 'shopBack': this.showingShop = false; break;
            case 'worldMap': this.showingWorldMap = true; this.showingShop = false; this.showingSettings = false; this.showingLeaderboard = false; this.showingPrivacyPolicy = false; this.showingTerms = false; break;
            case 'wmBack':
                this.showingWorldMap = false;
                break;
            case 'settings': this.showingSettings = true; this.showingShop = false; this.showingWorldMap = false; this.showingLeaderboard = false; this.showingPrivacyPolicy = false; this.showingTerms = false; break;
            case 'settingsBack': this.showingSettings = false; this.showingPrivacyPolicy = false; this.showingTerms = false; break;
            case 'leaderboard': this.showingLeaderboard = true; this.showingShop = false; this.showingWorldMap = false; this.showingSettings = false; this.showingPrivacyPolicy = false; this.showingTerms = false; break;
            case 'lbBack': this.showingLeaderboard = false; break;
            case 'set_privacy': this.showingPrivacyPolicy = true; break;
            case 'privacyBack': this.showingPrivacyPolicy = false; break;
            case 'set_terms': this.showingTerms = true; break;
            case 'termsBack': this.showingTerms = false; break;
            case 'set_rate':
                if (typeof Android !== 'undefined' && Android.openPlayStore) {
                    try { Android.openPlayStore(); } catch(e) {
                        window.open('https://play.google.com/store/apps/details?id=com.ravidandaiya.crowdrush', '_blank');
                    }
                } else {
                    window.open('https://play.google.com/store/apps/details?id=com.ravidandaiya.crowdrush', '_blank');
                }
                break;
            case 'prev': { const c = this.game.shop.getCurrentLevel(); if (c>1) this.game.shop.setCurrentLevel(c-1); } break;
            case 'next': { const c = this.game.shop.getCurrentLevel(); if (c<this.game.shop.getHighestLevel()) this.game.shop.setCurrentLevel(c+1); } break;
            case 'retry':
                if (this.game.currentLevel && this.game.currentLevel.isDaily) {
                    this.game.startLevel(this.game.currentLevel);
                } else {
                    this.game.startLevel(this.game.shop.getCurrentLevel());
                }
                break;
            case 'revive': 
                this.game.showAd('revive', () => {
                    this.game.revive();
                });
                break;
            case 'ad_2x':
                this.game.showAd('2x', () => {
                    if (this.resultData && !this.rewarded2x) {
                        this.game.shop.addCoins(this.resultData.coinsEarned);
                        this.rewarded2x = true;
                        this.addHudPop('+' + this.resultData.coinsEarned + ' Coins!', '#FFD700');
                    }
                });
                break;
            case 'ad_shop':
                this.game.showAd('shop', () => {
                    this.game.shop.addCoins(500);
                    this.addHudPop('+500 Coins!', '#FFD700');
                });
                break;
            case 'menu': case 'menuR': case 'exitToMenu': this.game.goToMenu(); break;
            case 'nextLevelR': {
                const n = this.game.shop.getCurrentLevel() + 1;
                if (n <= LEVELS.length) { this.game.shop.setCurrentLevel(n); this.game.startLevel(n); }
            } break;
            case 'startStory': this.game.state = 'PLAYING'; break;
            case 'set_snd_toggle': s.soundEnabled = !s.soundEnabled; if (this.game.sound) this.game.sound.enabled = s.soundEnabled; break;
            case 'set_sens_up': s.sensitivity = Math.min(3.0, s.sensitivity + 0.2); break;
            case 'set_sens_dn': s.sensitivity = Math.max(0.2, s.sensitivity - 0.2); break;
            case 'set_gfx_toggle': s.graphicsQuality = s.graphicsQuality === 'high' ? 'low' : 'high'; break;
            case 'set_reset': {
                if (confirm('Reset ALL save data? This cannot be undone.')) {
                    localStorage.removeItem('crowdRushSave');
                    location.reload();
                }
            } break;
            default:
                if (id.startsWith('wm_play_')) {
                    const lv = parseInt(id.split('_')[2]);
                    if (lv) {
                        this.showingWorldMap = false;
                        this.game.shop.setCurrentLevel(lv);
                        this.game.startLevel(lv);
                    }
                }
                else if (id.startsWith('buys_')) this.game.shop.buySkin(id.slice(5));
                else if (id.startsWith('sel_'))  this.game.shop.selectSkin(id.slice(4));
                else if (id.startsWith('buy_'))  this.game.shop.buyUpgrade(id.slice(4));
        }
    }

    drawStoryIntro(ctx) {
        this.activeButtons = [];
        const w = GC.W, h = GC.H;

        // Dark tint overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, w, h);

        // Header Title
        ctx.fillStyle = '#FFC800';
        ctx.font = 'bold 22px "Outfit", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = '#FF8800'; ctx.shadowBlur = 10;
        ctx.fillText('👑 THE PRINCE\'S QUEST 👑', w / 2, h * 0.20);
        ctx.shadowBlur = 0;

        // Narrative box with custom glow shadow border
        const boxX = 24, boxY = h * 0.26, boxW = w - 48, boxH = h * 0.40;
        ctx.save();
        ctx.shadowColor = '#00E5FF';
        ctx.shadowBlur = 15;
        ctx.fillStyle = 'rgba(10, 20, 45, 0.9)';
        ctx.strokeStyle = 'rgba(0, 200, 255, 0.5)';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.roundRect(boxX, boxY, boxW, boxH, 16); ctx.fill(); ctx.stroke();
        ctx.restore();

        // Story paragraphs
        const lines = [
            "Prince Arthur's kingdom is in peril!",
            "The evil Obsidian Emperor has stormed the",
            "castle and kidnapped Princess Aurelia,",
            "locking her deep inside the Volcano Core.",
            "",
            "As the Prince, you must lead your loyal",
            "soldiers through dangerous paths,",
            "multiply your forces through magic gates,",
            "and crush the Emperor's dark fortress!",
            "",
            "Lead the charge and rescue the Princess!"
        ];

        let lineY = boxY + 22;
        ctx.fillStyle = '#E2E8F0';
        ctx.textAlign = 'center';
        for (const line of lines) {
            if (line === "") {
                lineY += 12;
                continue;
            }
            if (line.includes("Prince Arthur") || line.includes("Princess Aurelia")) {
                ctx.fillStyle = '#00E5FF';
                ctx.font = 'bold 13px "Outfit", sans-serif';
            } else if (line.includes("Obsidian Emperor")) {
                ctx.fillStyle = '#FF4466';
                ctx.font = 'bold 13px "Outfit", sans-serif';
            } else {
                ctx.fillStyle = '#AAC8EE';
                ctx.font = '12px "Outfit", sans-serif';
            }
            ctx.fillText(line, w / 2, lineY);
            lineY += 19;
        }

        // Play Button
        this._btn(ctx, w / 2, h * 0.76, 180, 50, '⚔️ START QUEST', '#00AA55', '#00EE77', 'startStory');
    }
}
