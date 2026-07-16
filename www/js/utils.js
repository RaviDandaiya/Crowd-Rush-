// ============================================================
// utils.js — Math helpers, color palettes, easing functions
// ============================================================

const Utils = {
    lerp(a, b, t) { return a + (b - a) * t; },
    clamp(val, min, max) { return Math.max(min, Math.min(max, val)); },
    randomRange(min, max) { return min + Math.random() * (max - min); },
    randomInt(min, max) { return Math.floor(Utils.randomRange(min, max + 1)); },
    distance(x1, y1, x2, y2) { return Math.sqrt((x2-x1)**2 + (y2-y1)**2); },
    easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); },
    easeOutElastic(t) {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
    easeOutBack(t) {
        const c1 = 1.70158, c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    formatNumber(n) {
        if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return Math.floor(n).toString();
    },
    hsl(h, s, l, a = 1) {
        return a < 1 ? `hsla(${h},${s}%,${l}%,${a})` : `hsl(${h},${s}%,${l}%)`;
    }
};

// Level themes
const THEMES = {
    meadow: {
        sky: ['#87CEEB', '#E0F7FA'], ground: '#7EC850', groundDark: '#5DA038',
        lane: '#A8D878', laneLine: '#C8E8A0', laneEdge: '#5DA038',
        horizonColor: '#B8E4A0',
    },
    city: {
        sky: ['#1a1a3e', '#2C3E50'], ground: '#555', groundDark: '#3A3A3A',
        lane: '#666', laneLine: '#FFCC00', laneEdge: '#444',
        horizonColor: '#3a3a5e',
    },
    desert: {
        sky: ['#FF8C42', '#FFD700'], ground: '#D2A679', groundDark: '#B8895A',
        lane: '#E8C89E', laneLine: '#C8A878', laneEdge: '#B8895A',
        horizonColor: '#DABA90',
    },
    volcano: {
        sky: ['#1A0A00', '#8B1A00'], ground: '#3A1A08', groundDark: '#1A0800',
        lane: '#5A2010', laneLine: '#FF4400', laneEdge: '#8B1A00',
        horizonColor: '#FF4400',
    },
};

const CROWD_SKINS = {
    default: { name: 'Blue', body: '#4A9EFF', head: '#6BB5FF', outline: '#2D7AD4', cost: 0, type: 'default' },
    steve: { name: 'Steve (3D)', body: '#00B4D8', head: '#E0A96D', outline: '#0077B6', cost: 300, type: 'steve' },
    creeper: { name: 'Creeper (3D)', body: '#38B000', head: '#70E000', outline: '#007200', cost: 500, type: 'creeper' },
    devil: { name: 'Devil (3D)', body: '#D90429', head: '#EF233C', outline: '#8D0801', cost: 800, type: 'devil' },
    robot: { name: 'Robot (3D)', body: '#73A942', head: '#ADF7B6', outline: '#1A5F7A', cost: 1000, type: 'robot' },
    rainbow: { name: 'Rainbow', body: 'rainbow', head: 'rainbow', outline: '#888', cost: 1200, type: 'rainbow' },
};

const ENEMY_COLORS = { body: '#FF4444', head: '#FF6666', outline: '#CC2222' };
const BOSS_COLORS   = { body: '#880000', head: '#CC0000', outline: '#440000' };

const GC = {
    W: 400, H: 720,
    LANE_W: 240,
    CROWD_SPEED: 2.4,
    FIRE_RATE: 0.7,
    UNITS_PER_SHOT: 4,
    CLASH_RATE: 18,
    UNIT_R: 5,
    GATE_W: 120,
    GATE_H: 70,
    // 3D perspective parameters
    HORIZON_Y: 180,     // where the vanishing point is (Y on screen)
    GROUND_TOP: 180,     // where ground starts
    CROWD_SCREEN_Y: 580, // where the crowd sits on screen
    CANNON_Y: 670,       // cannon position
    CAMERA_DEPTH: 1200,  // rendering distance depth
};
