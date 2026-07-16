// ============================================================
// level.js — Level configurations (10 levels, 4 worlds)
// ============================================================

const LEVELS = [
    // ===================== WORLD 1: GREEN MEADOW =====================
    {
        id: 1, name: 'Meadow Trail', world: 1, theme: 'meadow', startCrowd: 10, laneLength: 3200,
        gates: [
            { y: 450,  left: { type: 'multiply', value: 2, label: '×2' },   right: { type: 'add', value: 5, label: '+5' } },
            { y: 1000, left: { type: 'add', value: 10, label: '+10' },      right: { type: 'multiply', value: 2, label: '×2' } },
            { y: 1400, left: { type: 'golden' },                             right: { type: 'subtract', value: 8, label: '-8' } },
            { y: 1900, left: { type: 'multiply', value: 3, label: '×3' },   right: { type: 'add', value: 15, label: '+15' } },
            { y: 2400, left: { type: 'add', value: 10, label: '+10' },      right: { type: 'multiply', value: 2, label: '×2' } },
        ],
        obstacles: [
            { y: 750, type: 'saw', range: 0.7, speed: 2.5 },
            { y: 1650, type: 'hammer', laneX: -0.5, speed: 3 },
            { y: 2150, type: 'pit', laneX: 0.4, width: 50 }
        ],
        enemies: [{ y: 2700, count: 20 }],
        fortress: { hp: 100, phases: [
            { hp: 100, label: 'Outer Wall', theme: 'stone' }
        ]}, hasBranching: false,
    },
    {
        id: 2, name: 'Meadow Hills', world: 1, theme: 'meadow', startCrowd: 10, laneLength: 3800,
        gates: [
            { y: 450,  left: { type: 'multiply', value: 2, label: '×2' },   right: { type: 'subtract', value: 8, label: '-8' } },
            { y: 1000, left: { type: 'add', value: 15, label: '+15' },      right: { type: 'multiply', value: 3, label: '×3' } },
            { y: 1500, left: { type: 'shield' },                             right: { type: 'giant', value: 4 } },
            { y: 2100, left: { type: 'archer', value: 10 },                  right: { type: 'subtract', value: 12, label: '-12' } },
            { y: 2700, left: { type: 'add', value: 20, label: '+20' },      right: { type: 'multiply', value: 2, label: '×2' } },
        ],
        obstacles: [
            { y: 750, type: 'saw', range: 0.8, speed: 3.5 },
            { y: 1250, type: 'hammer', laneX: 0.6, speed: 3 },
            { y: 1800, type: 'pit', laneX: -0.3, width: 60, isLava: true },
            { y: 2400, type: 'saw', range: 0.5, speed: 4.5 }
        ],
        enemies: [{ y: 2000, count: 30 }, { y: 3000, count: 40 }],
        fortress: { hp: 150, phases: [
            { hp: 100, label: 'Outer Wall', theme: 'stone' },
            { hp: 50, label: 'Inner Keep', theme: 'dark' }
        ]}, hasBranching: false,
    },
    // ===================== WORLD 2: CITY STREET =====================
    {
        id: 3, name: 'Downtown Rush', world: 2, theme: 'city', startCrowd: 10, laneLength: 4500,
        gates: [
            { y: 450,  left: { type: 'multiply', value: 3, label: '×3' },     right: { type: 'subtract', value: 15, label: '-15' } },
            { y: 1000, left: { type: 'subtract', value: 10, label: '-10' },   right: { type: 'multiply', value: 2, label: '×2' } },
            { y: 1600, left: { type: 'explode' },                              right: { type: 'add', value: 40, label: '+40' } },
            { y: 2200, left: { type: 'giant', value: 6 },                      right: { type: 'subtract', value: 20, label: '-20' } },
            { y: 2800, left: { type: 'add', value: 20, label: '+20' },        right: { type: 'archer', value: 15 } },
            { y: 3400, left: { type: 'multiply', value: 4, label: '×4' },     right: { type: 'divide', value: 2, label: '÷2' } },
        ],
        obstacles: [
            { y: 750, type: 'saw', range: 0.9, speed: 2.5 },
            { y: 1300, type: 'pit', laneX: 0.3, width: 40 },
            { y: 1900, type: 'hammer', laneX: -0.6, speed: 2.5 },
            { y: 2500, type: 'saw', range: 0.6, speed: 3 },
            { y: 3100, type: 'hammer', laneX: 0.6, speed: 2.5 }
        ],
        enemies: [
            { y: 2600, count: 30 },
            { y: 3800, count: 60, type: 'split_boss' }
        ],
        fortress: { hp: 300, phases: [
            { hp: 200, label: 'City Wall', theme: 'city' },
            { hp: 100, label: 'Police HQ', theme: 'dark' }
        ]}, hasBranching: false,
    },
    {
        id: 4, name: 'Neon District', world: 2, theme: 'city', startCrowd: 10, laneLength: 5000,
        gates: [
            { y: 450,  left: { type: 'multiply', value: 2, label: '×2' },     right: { type: 'subtract', value: 12, label: '-12' } },
            { y: 1000, left: { type: 'golden' },                               right: { type: 'divide', value: 2, label: '÷2' } },
            { y: 1700, left: { type: 'add', value: 25, label: '+25' },        right: { type: 'multiply', value: 2, label: '×2' } },
            { y: 2300, left: { type: 'multiply', value: 3, label: '×3' },     right: { type: 'subtract', value: 30, label: '-30' } },
            { y: 3000, left: { type: 'shield' },                               right: { type: 'divide', value: 3, label: '÷3' } },
            { y: 3700, left: { type: 'multiply', value: 2, label: '×2' },     right: { type: 'add', value: 30, label: '+30' } },
            { y: 4300, left: { type: 'multiply', value: 4, label: '×4' },     right: { type: 'subtract', value: 40, label: '-40' } },
        ],
        enemies: [
            { y: 2000, count: 60 },
            { y: 3500, count: 100, type: 'split_boss' },
            { y: 4500, count: 80 }
        ],
        fortress: { hp: 400, phases: [
            { hp: 200, label: 'Steel Gate', theme: 'city' },
            { hp: 150, label: 'HQ Lobby', theme: 'dark' },
            { hp: 50, label: 'Boss Guard', theme: 'boss' }
        ]}, hasBranching: true,
    },
    // ===================== WORLD 3: DESERT CANYON =====================
    {
        id: 5, name: 'Sand Dunes', world: 3, theme: 'desert', startCrowd: 10, laneLength: 5500,
        gates: [
            { y: 450,  left: { type: 'multiply', value: 2, label: '×2' },     right: { type: 'add', value: 15, label: '+15' } },
            { y: 1000, left: { type: 'divide', value: 3, label: '÷3' },       right: { type: 'multiply', value: 3, label: '×3' } },
            { y: 1600, left: { type: 'add', value: 20, label: '+20' },        right: { type: 'subtract', value: 30, label: '-30' } },
            { y: 2200, left: { type: 'multiply', value: 3, label: '×3' },     right: { type: 'divide', value: 2, label: '÷2' } },
            { y: 2800, left: { type: 'explode' },                              right: { type: 'subtract', value: 20, label: '-20' } },
            { y: 3400, left: { type: 'multiply', value: 2, label: '×2' },     right: { type: 'add', value: 50, label: '+50' } },
            { y: 4000, left: { type: 'golden' },                               right: { type: 'multiply', value: 4, label: '×4' } },
        ],
        enemies: [
            { y: 2500, count: 100 },
            { y: 3800, count: 150, type: 'split_boss' },
            { y: 5000, count: 120 }
        ],
        fortress: { hp: 600, phases: [
            { hp: 300, label: 'Sand Fort', theme: 'desert' },
            { hp: 300, label: 'Pyramid Core', theme: 'dark' }
        ]}, hasBranching: true,
    },
    {
        id: 6, name: 'Canyon Gorge', world: 3, theme: 'desert', startCrowd: 10, laneLength: 6000,
        gates: [
            { y: 450,  left: { type: 'multiply', value: 2, label: '×2' },     right: { type: 'add', value: 15, label: '+15' } },
            { y: 1000, left: { type: 'divide', value: 3, label: '÷3' },       right: { type: 'multiply', value: 3, label: '×3' } },
            { y: 1600, left: { type: 'shield' },                               right: { type: 'subtract', value: 30, label: '-30' } },
            { y: 2200, left: { type: 'multiply', value: 3, label: '×3' },     right: { type: 'divide', value: 2, label: '÷2' } },
            { y: 2800, left: { type: 'subtract', value: 20, label: '-20' },   right: { type: 'multiply', value: 2, label: '×2' } },
            { y: 3400, left: { type: 'multiply', value: 2, label: '×2' },     right: { type: 'add', value: 50, label: '+50' } },
            { y: 4000, left: { type: 'divide', value: 2, label: '÷2' },       right: { type: 'multiply', value: 4, label: '×4' } },
            { y: 4600, left: { type: 'multiply', value: 3, label: '×3' },     right: { type: 'subtract', value: 40, label: '-40' } },
            { y: 5200, left: { type: 'golden' },                               right: { type: 'explode' } },
        ],
        enemies: [
            { y: 2500, count: 100 },
            { y: 3800, count: 150, type: 'split_boss' },
            { y: 5200, count: 200 }
        ],
        fortress: { hp: 750, phases: [
            { hp: 300, label: 'Stone Rampart', theme: 'desert' },
            { hp: 300, label: 'Canyon Keep', theme: 'dark' },
            { hp: 150, label: 'Desert Warlord', theme: 'boss' }
        ]}, hasBranching: true,
    },
    // ===================== WORLD 4: VOLCANO =====================
    {
        id: 7, name: 'Lava Fields', world: 4, theme: 'volcano', startCrowd: 10, laneLength: 6500,
        gates: [
            { y: 500,  left: { type: 'multiply', value: 3, label: '×3' },     right: { type: 'subtract', value: 20, label: '-20' } },
            { y: 1100, left: { type: 'add', value: 25, label: '+25' },        right: { type: 'divide', value: 3, label: '÷3' } },
            { y: 1700, left: { type: 'golden' },                               right: { type: 'subtract', value: 35, label: '-35' } },
            { y: 2400, left: { type: 'multiply', value: 4, label: '×4' },     right: { type: 'divide', value: 2, label: '÷2' } },
            { y: 3000, left: { type: 'shield' },                               right: { type: 'subtract', value: 50, label: '-50' } },
            { y: 3700, left: { type: 'multiply', value: 3, label: '×3' },     right: { type: 'add', value: 40, label: '+40' } },
            { y: 4300, left: { type: 'explode' },                              right: { type: 'divide', value: 4, label: '÷4' } },
            { y: 5000, left: { type: 'multiply', value: 5, label: '×5' },     right: { type: 'subtract', value: 60, label: '-60' } },
        ],
        enemies: [
            { y: 2200, count: 120, type: 'split_boss' },
            { y: 3800, count: 200 },
            { y: 5500, count: 180, type: 'split_boss' }
        ],
        fortress: { hp: 1000, phases: [
            { hp: 400, label: 'Lava Gate', theme: 'volcano' },
            { hp: 400, label: 'Fire Keep', theme: 'dark' },
            { hp: 200, label: 'Volcano Lord', theme: 'boss' }
        ]}, hasBranching: true,
    },
    {
        id: 8, name: 'Magma Core', world: 4, theme: 'volcano', startCrowd: 10, laneLength: 7000,
        gates: [
            { y: 500,  left: { type: 'multiply', value: 3, label: '×3' },     right: { type: 'subtract', value: 25, label: '-25' } },
            { y: 1100, left: { type: 'golden' },                               right: { type: 'divide', value: 3, label: '÷3' } },
            { y: 1800, left: { type: 'multiply', value: 4, label: '×4' },     right: { type: 'subtract', value: 40, label: '-40' } },
            { y: 2500, left: { type: 'shield' },                               right: { type: 'divide', value: 2, label: '÷2' } },
            { y: 3200, left: { type: 'multiply', value: 2, label: '×2' },     right: { type: 'subtract', value: 50, label: '-50' } },
            { y: 3900, left: { type: 'explode' },                              right: { type: 'multiply', value: 3, label: '×3' } },
            { y: 4600, left: { type: 'multiply', value: 5, label: '×5' },     right: { type: 'subtract', value: 70, label: '-70' } },
            { y: 5400, left: { type: 'golden' },                               right: { type: 'divide', value: 4, label: '÷4' } },
            { y: 6200, left: { type: 'multiply', value: 4, label: '×4' },     right: { type: 'shield' } },
        ],
        enemies: [
            { y: 2000, count: 150, type: 'split_boss' },
            { y: 3600, count: 250 },
            { y: 5200, count: 200, type: 'split_boss' },
            { y: 6500, count: 180 }
        ],
        fortress: { hp: 1500, phases: [
            { hp: 600, label: 'Obsidian Wall', theme: 'volcano' },
            { hp: 600, label: 'Magma Keep', theme: 'dark' },
            { hp: 300, label: 'Fire Titan', theme: 'boss' }
        ]}, hasBranching: true,
    },
    // ===================== BONUS LEVELS =====================
    {
        id: 9, name: 'Chaos Mode', world: 5, theme: 'city', startCrowd: 5, laneLength: 8000,
        gates: [
            { y: 400,  left: { type: 'golden' },                               right: { type: 'divide', value: 2, label: '÷2' } },
            { y: 900,  left: { type: 'multiply', value: 5, label: '×5' },     right: { type: 'subtract', value: 30, label: '-30' } },
            { y: 1600, left: { type: 'shield' },                               right: { type: 'divide', value: 3, label: '÷3' } },
            { y: 2300, left: { type: 'explode' },                              right: { type: 'subtract', value: 50, label: '-50' } },
            { y: 3000, left: { type: 'multiply', value: 4, label: '×4' },     right: { type: 'divide', value: 4, label: '÷4' } },
            { y: 3700, left: { type: 'golden' },                               right: { type: 'subtract', value: 80, label: '-80' } },
            { y: 4500, left: { type: 'multiply', value: 6, label: '×6' },     right: { type: 'divide', value: 3, label: '÷3' } },
            { y: 5300, left: { type: 'shield' },                               right: { type: 'subtract', value: 60, label: '-60' } },
            { y: 6200, left: { type: 'multiply', value: 5, label: '×5' },     right: { type: 'explode' } },
            { y: 7000, left: { type: 'golden' },                               right: { type: 'multiply', value: 8, label: '×8' } },
        ],
        enemies: [
            { y: 2000, count: 200, type: 'split_boss' },
            { y: 3500, count: 300 },
            { y: 5000, count: 250, type: 'split_boss' },
            { y: 6800, count: 400 }
        ],
        fortress: { hp: 2000, phases: [
            { hp: 800, label: 'Diamond Wall', theme: 'dark' },
            { hp: 800, label: 'Inner Sanctum', theme: 'boss' },
            { hp: 400, label: 'Final Guardian', theme: 'boss' }
        ]}, hasBranching: true,
    },
    {
        id: 10, name: 'The Final Stand', world: 5, theme: 'volcano', startCrowd: 8, laneLength: 10000,
        gates: [
            { y: 500,  left: { type: 'multiply', value: 3, label: '×3' },     right: { type: 'subtract', value: 20, label: '-20' } },
            { y: 1100, left: { type: 'golden' },                               right: { type: 'divide', value: 3, label: '÷3' } },
            { y: 1900, left: { type: 'multiply', value: 4, label: '×4' },     right: { type: 'subtract', value: 40, label: '-40' } },
            { y: 2700, left: { type: 'shield' },                               right: { type: 'divide', value: 4, label: '÷4' } },
            { y: 3500, left: { type: 'explode' },                              right: { type: 'multiply', value: 3, label: '×3' } },
            { y: 4300, left: { type: 'golden' },                               right: { type: 'subtract', value: 60, label: '-60' } },
            { y: 5200, left: { type: 'multiply', value: 5, label: '×5' },     right: { type: 'divide', value: 2, label: '÷2' } },
            { y: 6100, left: { type: 'shield' },                               right: { type: 'subtract', value: 80, label: '-80' } },
            { y: 7000, left: { type: 'multiply', value: 6, label: '×6' },     right: { type: 'explode' } },
            { y: 8000, left: { type: 'golden' },                               right: { type: 'divide', value: 3, label: '÷3' } },
            { y: 9000, left: { type: 'multiply', value: 8, label: '×8' },     right: { type: 'subtract', value: 100, label: '-100' } },
        ],
        enemies: [
            { y: 2000, count: 200 },
            { y: 3800, count: 350, type: 'split_boss' },
            { y: 5600, count: 400 },
            { y: 7200, count: 300, type: 'split_boss' },
            { y: 9000, count: 500 }
        ],
        fortress: { hp: 3000, phases: [
            { hp: 1000, label: 'Iron Fortress', theme: 'dark' },
            { hp: 1000, label: 'Dark Citadel', theme: 'boss' },
            { hp: 1000, label: 'The Ultimate Boss', theme: 'boss' }
        ]}, hasBranching: true,
    },
];

// World metadata for World Map UI
const WORLDS = [
    { id: 1, name: 'Green Meadow', levels: [1, 2], theme: 'meadow', emoji: '🌿' },
    { id: 2, name: 'City Streets', levels: [3, 4], theme: 'city', emoji: '🌆' },
    { id: 3, name: 'Desert Canyon', levels: [5, 6], theme: 'desert', emoji: '🏜️' },
    { id: 4, name: 'Volcano', levels: [7, 8], theme: 'volcano', emoji: '🌋' },
    { id: 5, name: 'Bonus World', levels: [9, 10], theme: 'city', emoji: '⭐' },
];
