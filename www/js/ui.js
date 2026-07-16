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
        const w = GC.W;

        // === 1. TOP PROGRESS BAR ===
        this._drawProgressBar(ctx, w);

        // === 2. COINS / GEMS TOP-RIGHT ===
        this._drawCoinBadge(ctx, w);

        // === 3. CROWD COUNT BADGE (above the crowd on-screen) ===
        this._drawCrowdBadge(ctx, w);

        // === 4. EXIT / PAUSE BUTTON (top-left) ===
        this._drawExitButton(ctx);

        // === 5. FORTRESS PHASE + ATTACK BANNER ===
        if (this.game.state === 'FORTRESS_ATTACK') {
            this._drawAttackBanner(ctx, w);
        }

        // === 6. CLASH INDICATOR ===
        if (this.game.state === 'CLASH') {
            this._drawClashBanner(ctx, w);
        }

        // === 7. COMBO INDICATOR ===
        const combo = this.game.combo;
        if (combo && combo.count >= 2) {
            this._drawComboIndicator(ctx, combo);
        }

        // === 8. SHIELD TIMER ===
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

        const bx = 16, by = 16, bw = w * 0.45, bh = 18;
        const radius = bh / 2;

        ctx.save();
        // Track background
        ctx.fillStyle = 'rgba(10, 15, 40, 0.6)';
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, radius); ctx.fill();

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
    }

    _drawCoinBadge(ctx, w) {
        // Gem icon + coin count pill — top right (matching reference)
        const bw = 90, bh = 28;
        const bx = w - bw - 12, by = 12;

        ctx.save();
        // Pill background
        ctx.fillStyle = 'rgba(10, 15, 40, 0.6)';
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, bh / 2); ctx.fill();

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

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.roundRect(-30, -16, 60, 32, 8); ctx.fill();

        // Blue badge background (or themed)
        const bg = ctx.createLinearGradient(0, -16, 0, 16);
        bg.addColorStop(0, this.themeColors.bg);
        bg.addColorStop(1, this.themeColors.primary);
        ctx.fillStyle = bg;
        ctx.beginPath(); ctx.roundRect(-28, -14, 56, 28, 7); ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath(); ctx.roundRect(-28, -14, 56, 12, 7); ctx.fill();

        // Count text
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 16px "Outfit", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 3;
        ctx.fillText(Utils.formatNumber(count), 0, 1);

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

    _drawAttackBanner(ctx, w) {
        if (this._attackBannerAlpha < 0.02) return;

        const phases = this.game.fortress.phases;
        const idx = this.game.fortress.phaseIndex;
        const phase = this.game.fortress.currentPhase;

        ctx.save();
        ctx.globalAlpha = this._attackBannerAlpha;

        // Phase label pill — below progress bar
        if (phase) {
            const pill_w = 180, pill_h = 16;
            const pill_x = (w - pill_w) / 2, pill_y = 120;
            
            const hpText = `${Math.ceil(this.game.fortress.hp)}/${this.game.fortress.maxHP}`;
            const hpRatio = Utils.clamp(this.game.fortress.hp / this.game.fortress.maxHP, 0, 1);
            
            // "City Wall [1/2]" top pill
            const title = `🏰 City Wall [${idx + 1}/${phases ? phases.length : 1}]`;
            ctx.fillStyle = 'rgba(10, 15, 30, 0.8)';
            ctx.beginPath(); ctx.roundRect(pill_x + 20, pill_y - 24, pill_w - 40, 20, 10); ctx.fill();
            
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 11px "Outfit", sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(title, pill_x + pill_w / 2, pill_y - 14);

            // Health bar background (dark grey)
            ctx.fillStyle = 'rgba(20, 25, 40, 0.9)';
            ctx.beginPath(); ctx.roundRect(pill_x, pill_y, pill_w, pill_h, 4); ctx.fill();

            // Health bar fill (red)
            if (hpRatio > 0) {
                ctx.fillStyle = '#FF3344';
                ctx.beginPath(); ctx.roundRect(pill_x, pill_y, pill_w * hpRatio, pill_h, 4); ctx.fill();
            }
            
            // Red hit flash on bar
            if (this.game.fortress.shake > 0) {
                ctx.fillStyle = `rgba(255, 255, 255, ${this.game.fortress.shake * 0.2})`;
                ctx.beginPath(); ctx.roundRect(pill_x, pill_y, pill_w, pill_h, 4); ctx.fill();
            }

            // Health text
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 10px "Outfit", sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(hpText, pill_x + pill_w / 2, pill_y + pill_h / 2 + 1);
        }

        ctx.restore();
    }

    _drawClashBanner(ctx, w) {
        const pulse = Math.sin(this.t * 8) * 0.1 + 0.9;
        ctx.save();
        ctx.translate(w / 2, 68);
        ctx.scale(pulse, pulse);
        ctx.fillStyle = '#FF4444';
        ctx.font = 'bold 22px "Outfit", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = '#FF0000'; ctx.shadowBlur = 16;
        ctx.fillText('⚔️  CLASH!  ⚔️', 0, 0);
        ctx.restore();
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

    // ============================================================
    // BUTTON HELPER — 3D Pill / Tactile style
    // ============================================================
    _btn(ctx, x, y, w, h, text, c1, c2, id) {
        ctx.save();
        const r = Math.min(h / 2, 16);

        // Bottom shadow layer
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath(); ctx.roundRect(x - w/2 + 2, y - h/2 + 5, w, h, r); ctx.fill();

        // 3D side extrusion
        ctx.fillStyle = c1;
        ctx.beginPath(); ctx.roundRect(x - w/2, y - h/2 + 4, w, h, r); ctx.fill();

        // Top face gradient
        const g = ctx.createLinearGradient(x, y - h/2, x, y + h/2);
        g.addColorStop(0, c2);
        g.addColorStop(1, c1);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.roundRect(x - w/2, y - h/2, w, h, r); ctx.fill();

        // Shine
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.beginPath(); ctx.roundRect(x - w/2 + 3, y - h/2 + 3, w - 6, h * 0.4, r); ctx.fill();

        // Stroke
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(x - w/2, y - h/2, w, h, r); ctx.stroke();

        // Text
        ctx.fillStyle = '#FFF';
        ctx.font = `bold ${Math.min(15, h * 0.42)}px "Outfit", sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 3;
        ctx.fillText(text, x, y - 1);

        ctx.restore();
        return { x: x - w/2, y: y - h/2, w, h, id };
    }

    // ============================================================
    // MAIN MENU
    // ============================================================
    drawMainMenu(ctx) {
        const w = GC.W, h = GC.H;

        if (this.showingShop)        { this.drawShop(ctx); return; }
        if (this.showingWorldMap)    { this.drawWorldMap(ctx); return; }
        if (this.showingSettings)    { this.drawSettings(ctx); return; }
        if (this.showingLeaderboard) { this.drawLeaderboard(ctx); return; }

        // Gradient background
        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, '#0A1628');
        bg.addColorStop(1, '#0D2240');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // Animated grid dots background
        ctx.save();
        for (let i = 0; i < 30; i++) {
            const px = ((i * 127 + this.t * 18) % w);
            const py = ((i * 173 + this.t * 12) % h);
            ctx.globalAlpha = 0.15 + Math.sin(i + this.t * 1.5) * 0.1;
            ctx.fillStyle = ['#00B4FF', '#FF69B4', '#FFD700', '#00FF88'][i % 4];
            ctx.beginPath(); ctx.arc(px, py, 2 + Math.sin(i + this.t) * 1, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();

        // Game title card
        this._drawTitleCard(ctx, w, h);

        // Level selector card
        this._drawLevelCard(ctx, w, h);

        // Main PLAY button
        this._btn(ctx, w / 2, h * 0.52, 200, 58, '▶   PLAY', '#00AA55', '#00EE77', 'play');

        // Bottom row: Shop | World Map | Leaderboard | Settings
        this._drawMenuBottomRow(ctx, w, h);

        // Coin display
        this._drawMenuCoinBadge(ctx, w, h);
    }

    _drawTitleCard(ctx, w, h) {
        const cy = h * 0.17;
        const ts = 1 + Math.sin(this.t * 1.8) * 0.015;

        ctx.save();
        ctx.translate(w / 2, cy);
        ctx.scale(ts, ts);

        // Glowing title
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 52px "Outfit", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = '#00B4FF'; ctx.shadowBlur = 30;
        ctx.fillText('CROWD', 0, -28);
        ctx.shadowColor = '#FF69B4'; ctx.shadowBlur = 30;
        ctx.fillText('RUSH', 0, 28);

        // Subtitle
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.font = '13px "Outfit", sans-serif';
        ctx.fillText('Grow your crowd. Crush the fortress!', 0, 62);

        ctx.restore();
    }

    _drawLevelCard(ctx, w, h) {
        const cy = h * 0.37;
        const cardW = w - 32, cardH = 70;

        ctx.save();

        // Card background
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(16, cy - cardH/2, cardW, cardH, 16); ctx.fill(); ctx.stroke();

        // Level info
        const lvNum = this.game.shop.getCurrentLevel();
        const li = lvNum - 1;
        const lvName = li < LEVELS.length ? LEVELS[li].name : '—';
        const world = li < LEVELS.length ? LEVELS[li].world : 1;

        ctx.fillStyle = 'rgba(0,180,255,0.8)';
        ctx.font = 'bold 11px "Outfit", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`WORLD ${world}  ·  LEVEL ${lvNum}`, w / 2, cy - 14);

        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 20px "Outfit", sans-serif';
        ctx.fillText(lvName, w / 2, cy + 8);

        // Stars
        const best = this.game.shop.getBestForLevel ? this.game.shop.getBestForLevel(lvNum) : null;
        const stars = best ? (best.crowd > 50 ? 3 : best.crowd > 20 ? 2 : 1) : 0;
        ctx.font = '14px sans-serif';
        ctx.fillText('⭐'.repeat(stars) + '☆'.repeat(3 - stars), w / 2, cy + 32);

        ctx.restore();

        // Nav arrows
        if (this.game.shop.getCurrentLevel() > 1)
            this._btn(ctx, 46, cy, 36, 36, '◀', '#334466', '#445577', 'prev');
        if (this.game.shop.getCurrentLevel() < this.game.shop.getHighestLevel())
            this._btn(ctx, w - 46, cy, 36, 36, '▶', '#334466', '#445577', 'next');
    }

    _drawMenuBottomRow(ctx, w, h) {
        const by = h * 0.64;
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
        const r = 14;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.roundRect(x - w/2 + 1, y - h/2 + 4, w, h, r); ctx.fill();

        // Body
        const g = ctx.createLinearGradient(x, y - h/2, x, y + h/2);
        g.addColorStop(0, c2); g.addColorStop(1, c1);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.roundRect(x - w/2, y - h/2, w, h, r); ctx.fill();

        // Shine
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.beginPath(); ctx.roundRect(x - w/2 + 2, y - h/2 + 2, w - 4, h * 0.4, r); ctx.fill();

        // Icon
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(icon, x, y - 8);

        // Label
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = 'bold 10px "Outfit", sans-serif';
        ctx.fillText(label, x, y + 14);

        ctx.restore();
    }

    _drawMenuCoinBadge(ctx, w, h) {
        const coins = this.game.shop.getCoins();
        const bw = 140, bh = 36;
        const bx = (w - bw) / 2, by = h * 0.78;

        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath(); ctx.roundRect(bx + 2, by + 3, bw, bh, bh / 2); ctx.fill();

        const g = ctx.createLinearGradient(bx, by, bx + bw, by);
        g.addColorStop(0, '#1A3A1A');
        g.addColorStop(1, '#2A4A2A');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, bh / 2); ctx.fill();

        // Coin icon
        ctx.fillStyle = '#FFD700';
        ctx.beginPath(); ctx.arc(bx + 22, by + bh / 2, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFC200';
        ctx.beginPath(); ctx.arc(bx + 19, by + bh / 2 - 2, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFE066';
        ctx.font = 'bold 10px "Outfit", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('$', bx + 22, by + bh / 2);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px "Outfit", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(Utils.formatNumber(coins), bx + bw / 2 + 8, by + bh / 2);
        ctx.restore();

        // Version text
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = '10px "Outfit", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('Crowd Rush v2.0 — 10 Levels', w / 2, h - 16);
    }

    // ============================================================
    // WORLD MAP
    // ============================================================
    drawWorldMap(ctx) {
        const w = GC.W, h = GC.H;
        // Dark bg
        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, '#0A1628'); bg.addColorStop(1, '#0D2240');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

        // Header
        this._drawScreenHeader(ctx, w, '🗺️ WORLD MAP', '#00B4FF');

        const highest = this.game.shop.getHighestLevel();
        const cur = this.game.shop.getCurrentLevel();
        let yp = 72;

        const themeGrads = {
            meadow:  ['#1B8C32', '#27A842'],
            city:    ['#2C3E50', '#3D5166'],
            desert:  ['#C47A35', '#D4935A'],
            volcano: ['#6B1A00', '#8B2A00'],
        };

        for (const world of (typeof WORLDS !== 'undefined' ? WORLDS : [])) {
            const unlocked = world.levels[0] <= highest;
            const [c1, c2] = themeGrads[world.theme] || ['#333', '#555'];

            ctx.save();
            const cardH = 102;

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

                    // Name below
                    ctx.fillStyle = 'rgba(255,255,255,0.6)';
                    ctx.font = '9px "Outfit", sans-serif';
                    ctx.fillText(lev ? lev.name : '', dotX, yp + 86);

                    dotX += 80;
                }
            }
            ctx.restore();
            yp += 114;
        }

        this._btn(ctx, w / 2, h - 34, 130, 34, '← Back', '#334466', '#445577', 'wmBack');
    }

    // ============================================================
    // SETTINGS
    // ============================================================
    drawSettings(ctx) {
        const w = GC.W, h = GC.H;
        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, '#0A1628'); bg.addColorStop(1, '#0D2240');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

        this._drawScreenHeader(ctx, w, '⚙️ SETTINGS', '#8899BB');

        const s = this.game.settings;
        let yp = 72;

        const row = (label, val, id1, lbl1, id2, lbl2) => {
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

            if (id2) {
                this._btn(ctx, w - 95, yp + 26, 42, 26, lbl1, '#00AA55', '#00CC66', id1);
                this._btn(ctx, w - 46, yp + 26, 42, 26, lbl2, '#334466', '#445577', id2);
            } else if (id1) {
                this._btn(ctx, w - 54, yp + 26, 62, 26, lbl1, '#00AA55', '#00CC66', id1);
            }
            yp += 62;
        };

        row('🔊 Sound', s.soundEnabled ? 'ON' : 'OFF', 'set_snd_toggle', s.soundEnabled ? 'Mute' : 'On', null, null);
        row('🎮 Sensitivity', `${s.sensitivity.toFixed(1)}x`, 'set_sens_up', '+', 'set_sens_dn', '−');
        row('🖥️ Graphics', s.graphicsQuality.toUpperCase(), 'set_gfx_toggle', s.graphicsQuality === 'high' ? 'Low' : 'High', null, null);

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

        this._btn(ctx, w / 2, h - 34, 130, 34, '← Back', '#334466', '#445577', 'settingsBack');
    }

    // ============================================================
    // LEADERBOARD
    // ============================================================
    drawLeaderboard(ctx) {
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
        const w = GC.W, h = GC.H;

        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, '#0A200A'); bg.addColorStop(1, '#0D3015');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

        // Confetti particles (simple)
        for (let i = 0; i < 20; i++) {
            const px = ((i * 137 + this.t * 30) % w);
            const py = ((i * 89 + this.t * 22) % h);
            ctx.save();
            ctx.globalAlpha = 0.6 + Math.sin(i + this.t * 3) * 0.4;
            ctx.fillStyle = ['#FFD700', '#FF69B4', '#00FF88', '#00DDFF'][i % 4];
            ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }

        // Header
        const bounce = 1 + Math.sin(this.t * 4) * 0.04;
        ctx.save();
        ctx.translate(w / 2, h * 0.12);
        ctx.scale(bounce, bounce);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 34px "Outfit", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 20;
        ctx.fillText('🏆 LEVEL COMPLETE!', 0, 0);
        ctx.restore();

        // Trophy
        ctx.font = '52px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowBlur = 0;
        ctx.fillText('🎉', w / 2, h * 0.26);

        // Stats card
        if (this.resultData) {
            const d = this.resultData;
            const cardY = h * 0.34;
            const cardH = 160;

            ctx.fillStyle = 'rgba(255,255,255,0.07)';
            ctx.strokeStyle = 'rgba(255,255,255,0.12)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.roundRect(w * 0.1, cardY, w * 0.8, cardH, 16); ctx.fill(); ctx.stroke();

            const sy = cardY + 28;
            const sg = 36;

            const stat = (icon, label, val, color, row) => {
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.font = '12px "Outfit", sans-serif';
                ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
                ctx.fillText(`${icon} ${label}`, w * 0.15, sy + row * sg);

                ctx.fillStyle = color;
                ctx.font = 'bold 14px "Outfit", sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(val, w * 0.88, sy + row * sg);
            };

            stat('👥', 'Crowd Remaining', d.crowdRemaining, '#4ADFFF', 0);
            stat('💥', 'Fortress Damage', d.damageDealt, '#FF8866', 1);
            stat('🪙', 'Coins Earned', `+${d.coinsEarned}`, '#FFD700', 2);

            // Stars
            const stars = d.crowdRemaining > 50 ? 3 : d.crowdRemaining > 20 ? 2 : 1;
            ctx.font = '28px sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('⭐'.repeat(stars) + '☆'.repeat(3 - stars), w / 2, cardY + cardH - 24);
        }

        if (!this.rewarded2x) {
            this._btn(ctx, w / 2, h * 0.65, 180, 44, '📺 2x Coins (Ad)', '#DD7700', '#FF9900', 'ad_2x');
        } else {
            this._btn(ctx, w / 2, h * 0.65, 180, 44, '✅ Coins Doubled!', '#555', '#777', 'none');
        }

        if (this.game.shop.getCurrentLevel() < LEVELS.length) {
            this._btn(ctx, w / 2, h * 0.76, 200, 52, '▶  Next Level', '#00AA55', '#00CC66', 'nextLevelR');
        }
        this._btn(ctx, w / 2, h * 0.86, 150, 40, '🏠  Menu', '#334466', '#445577', 'menuR');
    }

    // ============================================================
    // SHOP
    // ============================================================
    drawShop(ctx) {
        const w = GC.W, h = GC.H;
        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, '#0A1628'); bg.addColorStop(1, '#150A28');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

        this._drawScreenHeader(ctx, w, '🛒 SHOP', '#C084FC');

        // Coin display under header
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px "Outfit", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`🪙 ${this.game.shop.getCoins()}`, w / 2, 58);
        
        // Add Free Coins button
        this._btn(ctx, w - 50, 58, 80, 26, '📺 +500', '#DD7700', '#FF9900', 'ad_shop');

        // Section: Upgrades
        this._drawSectionLabel(ctx, w, 85, '⚡ UPGRADES', '#00DDFF');

        const ups = [
            { key: 'speed',      icon: '⚡', name: 'Run Speed',   desc: 'Move faster down the lane' },
            { key: 'startCrowd', icon: '👥', name: 'Start Crowd', desc: 'More units at start (+5)' },
            { key: 'gateMagnet', icon: '🧲', name: 'Gate Magnet', desc: 'Auto-steer to best gate' },
        ];
        let yp = 100;
        for (const u of ups) {
            const lv = this.game.shop.getUpgradeLevel(u.key);
            const cost = this.game.shop.getUpgradeCost(u.key);
            this._drawUpgradeRow(ctx, w, yp, u, lv, cost);
            yp += 58;
        }

        // Section: Skins
        this._drawSectionLabel(ctx, w, yp + 8, '🎨 SKINS', '#FF69B4');
        yp += 26;

        for (const [k, skin] of Object.entries(CROWD_SKINS)) {
            const owned = this.game.shop.isSkinUnlocked(k);
            const sel = this.game.shop.getCurrentSkin() === k;
            this._drawSkinRow(ctx, w, yp, k, skin, owned, sel);
            yp += 48;
        }

        this._btn(ctx, w / 2, h - 34, 130, 34, '← Back', '#334466', '#445577', 'shopBack');
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

        // Level pip dots
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = i < lv ? '#00FF88' : 'rgba(255,255,255,0.15)';
            ctx.beginPath(); ctx.arc(62 + i * 13, y + 46, 4, 0, Math.PI * 2); ctx.fill();
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
        ctx.fillStyle = sel ? 'rgba(0,180,255,0.12)' : 'rgba(255,255,255,0.04)';
        ctx.strokeStyle = sel ? 'rgba(0,200,255,0.5)' : 'rgba(255,255,255,0.07)';
        ctx.lineWidth = sel ? 1.5 : 1;
        ctx.beginPath(); ctx.roundRect(14, y, w - 28, 42, 9); ctx.fill(); ctx.stroke();

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
        const w = GC.W, h = GC.H, btns = [];
        if (this.game.state === 'MENU') {
            if (this.showingShop) {
                btns.push({ x: w/2-65, y: h-51, w: 130, h: 34, id: 'shopBack' });
                btns.push({ x: w-90, y: 45, w: 80, h: 26, id: 'ad_shop' });
                const ups = ['speed','startCrowd','gateMagnet'];
                let yp = 100;
                for (const k of ups) {
                    if (this.game.shop.getUpgradeCost(k)) btns.push({ x: w-89, y: yp+12, w: 70, h: 28, id: `buy_${k}` });
                    yp += 58;
                }
                yp += 26;
                for (const k of Object.keys(CROWD_SKINS)) {
                    const owned = this.game.shop.isSkinUnlocked(k);
                    const sel = this.game.shop.getCurrentSkin() === k;
                    if (!sel) btns.push({ x: w-81, y: yp+9, w: 70, h: 24, id: owned ? `sel_${k}` : `buys_${k}` });
                    yp += 48;
                }
            } else if (this.showingWorldMap) {
                btns.push({ x: w/2-65, y: h-51, w: 130, h: 34, id: 'wmBack' });
                let yp = 72;
                for (const world of (typeof WORLDS !== 'undefined' ? WORLDS : [])) {
                    const highest = this.game.shop.getHighestLevel();
                    if (world.levels[0] <= highest) {
                        let dotX = 50;
                        for (const lid of world.levels) {
                            if (lid <= highest) btns.push({ x: dotX - 25, y: yp + 40, w: 50, h: 50, id: `wm_play_${lid}` });
                            dotX += 80;
                        }
                    }
                    yp += 114;
                }
            } else if (this.showingSettings) {
                btns.push({ x: w/2-65, y: h-51, w: 130, h: 34, id: 'settingsBack' });
                btns.push({ x: w-85, y: 85, w: 62, h: 26, id: 'set_snd_toggle' });
                btns.push({ x: w-116, y: 147, w: 42, h: 26, id: 'set_sens_up' });
                btns.push({ x: w-67, y: 147, w: 42, h: 26, id: 'set_sens_dn' });
                btns.push({ x: w-85, y: 209, w: 62, h: 26, id: 'set_gfx_toggle' });
                btns.push({ x: w-85, y: 271, w: 62, h: 26, id: 'set_reset' });
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
            btns.push({ x: 13, y: 4, w: 26, h: 26, id: 'exitToMenu' });
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
            case 'play': this.game.startLevel(this.game.shop.getCurrentLevel()); break;
            case 'shop': this.showingShop = true; this.showingWorldMap = false; this.showingSettings = false; this.showingLeaderboard = false; break;
            case 'shopBack': this.showingShop = false; break;
            case 'worldMap': this.showingWorldMap = true; this.showingShop = false; this.showingSettings = false; this.showingLeaderboard = false; break;
            case 'wmBack': this.showingWorldMap = false; break;
            case 'settings': this.showingSettings = true; this.showingShop = false; this.showingWorldMap = false; this.showingLeaderboard = false; break;
            case 'settingsBack': this.showingSettings = false; break;
            case 'leaderboard': this.showingLeaderboard = true; this.showingShop = false; this.showingWorldMap = false; this.showingSettings = false; break;
            case 'lbBack': this.showingLeaderboard = false; break;
            case 'prev': { const c = this.game.shop.getCurrentLevel(); if (c>1) this.game.shop.setCurrentLevel(c-1); } break;
            case 'next': { const c = this.game.shop.getCurrentLevel(); if (c<this.game.shop.getHighestLevel()) this.game.shop.setCurrentLevel(c+1); } break;
            case 'retry': this.game.startLevel(this.game.shop.getCurrentLevel()); break;
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
                if (id.startsWith('wm_play_')) { const lv = parseInt(id.split('_')[2]); if (lv) { this.game.shop.setCurrentLevel(lv); this.game.startLevel(lv); } }
                else if (id.startsWith('buys_')) this.game.shop.buySkin(id.slice(5));
                else if (id.startsWith('sel_'))  this.game.shop.selectSkin(id.slice(4));
                else if (id.startsWith('buy_'))  this.game.shop.buyUpgrade(id.slice(4));
        }
    }
}
