// ============================================================
// shop.js — Coin system, upgrades, skins persistence
// ============================================================

class Shop {
    constructor() { this.data = this.load(); }
    getDefaults() {
        return {
            coins: 0, currentLevel: 1, highestLevel: 1,
            currentSkin: 'default', unlockedSkins: ['default'],
            upgrades: { speed: 0, startCrowd: 0, gateMagnet: 0, feverDuration: 0, coinMagnet: 0 },
            bestRuns: [],
            totalCoinsEarned: 0,
        };
    }
    load() {
        try {
            const s = localStorage.getItem('crowdRushSave');
            if (s) {
                const parsed = JSON.parse(s);
                const merged = { ...this.getDefaults(), ...parsed };
                if (merged.upgrades.speed === undefined) {
                    merged.upgrades.speed = merged.upgrades.fireRate || 0;
                }
                if (merged.upgrades.feverDuration === undefined) merged.upgrades.feverDuration = 0;
                if (merged.upgrades.coinMagnet === undefined) merged.upgrades.coinMagnet = 0;
                return merged;
            }
        } catch(e) {}
        return this.getDefaults();
    }
    save() { try { localStorage.setItem('crowdRushSave', JSON.stringify(this.data)); } catch(e) {} }
    addCoins(n) { this.data.coins += n; this.data.totalCoinsEarned = (this.data.totalCoinsEarned || 0) + n; this.save(); }
    spendCoins(n) { if (this.data.coins >= n) { this.data.coins -= n; this.save(); return true; } return false; }
    getCoins() { return this.data.coins; }
    getTotalCoinsEarned() { return this.data.totalCoinsEarned || 0; }
    getUpgradeCost(t) {
        const c = { 
            speed: [250, 1000, 3000, 8000, 20000], 
            startCrowd: [300, 1200, 4000, 10000, 25000], 
            gateMagnet: [500, 2000, 6000, 15000, 30000],
            feverDuration: [400, 1500, 5000, 12000, 28000],
            coinMagnet: [350, 1400, 4500, 11000, 26000]
        };
        const l = this.data.upgrades[t] || 0; return l >= 5 ? null : c[t][l];
    }
    getUpgradeLevel(t) { return this.data.upgrades[t] || 0; }
    buyUpgrade(t) { const c = this.getUpgradeCost(t); if (c && this.spendCoins(c)) { this.data.upgrades[t] = (this.data.upgrades[t] || 0) + 1; this.save(); return true; } return false; }
    getSpeed() { return 2.0 + (this.data.upgrades.speed || 0) * 0.6; }
    getStartingCrowd() { return 10 + (this.data.upgrades.startCrowd || 0) * 15; }
    getGateMagnet() { return [0, 0.4, 1.0, 2.0, 3.5, 6.0][this.data.upgrades.gateMagnet || 0] || 0; }
    getFeverDuration() { return GC.FEVER_DURATION_BASE + (this.data.upgrades.feverDuration || 0) * 1.0; }
    getCoinMagnetRadius() { return (this.data.upgrades.coinMagnet || 0) * 15; }
    buySkin(k) { const s = CROWD_SKINS[k]; if (!s || this.data.unlockedSkins.includes(k)) return false; if (this.spendCoins(s.cost)) { this.data.unlockedSkins.push(k); this.save(); return true; } return false; }
    selectSkin(k) { if (this.data.unlockedSkins.includes(k)) { this.data.currentSkin = k; this.save(); return true; } return false; }
    isSkinUnlocked(k) { return this.data.unlockedSkins.includes(k); }
    getCurrentSkin() { return this.data.currentSkin; }
    completeLevel(id) { if (id >= this.data.highestLevel) this.data.highestLevel = Math.min(id + 1, LEVELS.length); this.save(); }
    getCurrentLevel() { return this.data.currentLevel; }
    setCurrentLevel(l) { this.data.currentLevel = l; this.save(); }
    getHighestLevel() { return this.data.highestLevel; }

    // Best run tracking
    trackBestRun(run) {
        if (!this.data.bestRuns) this.data.bestRuns = [];
        this.data.bestRuns.unshift(run);
        if (this.data.bestRuns.length > 10) this.data.bestRuns.length = 10;
        this.save();
    }
    getBestRuns() { return this.data.bestRuns || []; }
    getBestForLevel(id) {
        const runs = (this.data.bestRuns || []).filter(r => r.level === id);
        return runs.length ? runs.reduce((a, b) => a.coins > b.coins ? a : b) : null;
    }
}
