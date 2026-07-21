// ============================================================
// level.js — 20 Levels configuration across 6 Worlds (Hard Difficulty)
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
            { y: 750, type: 'saw', range: 0.7, speed: 3.0 },
            { y: 1650, type: 'hammer', laneX: -0.5, speed: 3.5 },
            { y: 2150, type: 'pit', laneX: 0.4, width: 50 }
        ],
        enemies: [{ y: 2700, count: 30 }],
        fortress: { hp: 150, phases: [
            { hp: 150, label: 'Outer Wall', theme: 'stone' }
        ]}, hasBranching: false,
    },
    {
        id: 2, name: 'Meadow Hills', world: 1, theme: 'meadow', startCrowd: 10, laneLength: 3800,
        gates: [
            { y: 450,  left: { type: 'multiply', value: 2, label: '×2' },   right: { type: 'subtract', value: 10, label: '-10' } },
            { y: 1000, left: { type: 'add', value: 15, label: '+15' },      right: { type: 'multiply', value: 3, label: '×3' } },
            { y: 1500, left: { type: 'shield' },                             right: { type: 'giant', value: 4 } },
            { y: 2100, left: { type: 'archer', value: 10 },                  right: { type: 'subtract', value: 15, label: '-15' } },
            { y: 2700, left: { type: 'add', value: 20, label: '+20' },      right: { type: 'multiply', value: 2, label: '×2' } },
        ],
        obstacles: [
            { y: 750, type: 'saw', range: 0.8, speed: 4.0 },
            { y: 1250, type: 'hammer', laneX: 0.6, speed: 3.5 },
            { y: 1800, type: 'pit', laneX: -0.3, width: 60, isLava: true },
            { y: 2400, type: 'saw', range: 0.5, speed: 4.5 }
        ],
        enemies: [{ y: 2000, count: 40 }, { y: 3000, count: 60 }],
        fortress: { hp: 250, phases: [
            { hp: 150, label: 'Outer Rampart', theme: 'stone' },
            { hp: 100, label: 'Inner Keep', theme: 'dark' }
        ]}, hasBranching: false,
    },
    {
        id: 3, name: 'Valley Pass', world: 1, theme: 'meadow', startCrowd: 10, laneLength: 4200,
        gates: [
            { y: 400,  left: { type: 'multiply', value: 3, label: '×3' },   right: { type: 'subtract', value: 15, label: '-15' } },
            { y: 950,  left: { type: 'divide', value: 2, label: '÷2' },      right: { type: 'multiply', value: 3, label: '×3' } },
            { y: 1600, left: { type: 'golden' },                             right: { type: 'subtract', value: 20, label: '-20' } },
            { y: 2200, left: { type: 'multiply', value: 2, label: '×2' },   right: { type: 'add', value: 25, label: '+25' } },
            { y: 2800, left: { type: 'shield' },                             right: { type: 'divide', value: 2, label: '÷2' } },
            { y: 3400, left: { type: 'multiply', value: 4, label: '×4' },   right: { type: 'subtract', value: 30, label: '-30' } },
        ],
        obstacles: [
            { y: 650, type: 'saw', range: 0.8, speed: 4.2 },
            { y: 1250, type: 'hammer', laneX: -0.4, speed: 4.0 },
            { y: 1900, type: 'pit', laneX: 0.2, width: 65, isLava: true },
            { y: 2500, type: 'saw', range: 0.9, speed: 4.8 },
            { y: 3100, type: 'hammer', laneX: 0.5, speed: 4.0 }
        ],
        enemies: [{ y: 1800, count: 50 }, { y: 2900, count: 80, type: 'split_boss' }, { y: 3600, count: 70 }],
        fortress: { hp: 400, phases: [
            { hp: 200, label: 'Stone Gate', theme: 'stone' },
            { hp: 200, label: 'Valley Stronghold', theme: 'dark' }
        ]}, hasBranching: true,
    },

    // ===================== WORLD 2: CITY STREET =====================
    {
        id: 4, name: 'Downtown Rush', world: 2, theme: 'city', startCrowd: 10, laneLength: 4600,
        gates: [
            { y: 450,  left: { type: 'multiply', value: 3, label: '×3' },     right: { type: 'subtract', value: 20, label: '-20' } },
            { y: 1000, left: { type: 'divide', value: 2, label: '÷2' },       right: { type: 'multiply', value: 2, label: '×2' } },
            { y: 1600, left: { type: 'explode' },                              right: { type: 'add', value: 40, label: '+40' } },
            { y: 2200, left: { type: 'giant', value: 6 },                      right: { type: 'subtract', value: 25, label: '-25' } },
            { y: 2800, left: { type: 'add', value: 30, label: '+30' },        right: { type: 'archer', value: 15 } },
            { y: 3400, left: { type: 'multiply', value: 4, label: '×4' },     right: { type: 'divide', value: 3, label: '÷3' } },
            { y: 4000, left: { type: 'multiply', value: 2, label: '×2' },     right: { type: 'subtract', value: 35, label: '-35' } },
        ],
        obstacles: [
            { y: 750, type: 'saw', range: 0.9, speed: 3.5 },
            { y: 1300, type: 'pit', laneX: 0.3, width: 55 },
            { y: 1900, type: 'hammer', laneX: -0.6, speed: 3.5 },
            { y: 2500, type: 'saw', range: 0.7, speed: 4.0 },
            { y: 3100, type: 'hammer', laneX: 0.6, speed: 3.5 },
            { y: 3700, type: 'pit', laneX: -0.4, width: 60 }
        ],
        enemies: [
            { y: 2400, count: 70 },
            { y: 3800, count: 100, type: 'split_boss' }
        ],
        fortress: { hp: 550, phases: [
            { hp: 300, label: 'City Wall', theme: 'city' },
            { hp: 250, label: 'Police HQ', theme: 'dark' }
        ]}, hasBranching: false,
    },
    {
        id: 5, name: 'Neon Highway', world: 2, theme: 'city', startCrowd: 10, laneLength: 5000,
        gates: [
            { y: 450,  left: { type: 'multiply', value: 2, label: '×2' },     right: { type: 'subtract', value: 18, label: '-18' } },
            { y: 1000, left: { type: 'golden' },                               right: { type: 'divide', value: 2, label: '÷2' } },
            { y: 1700, left: { type: 'add', value: 30, label: '+30' },        right: { type: 'multiply', value: 3, label: '×3' } },
            { y: 2300, left: { type: 'multiply', value: 3, label: '×3' },     right: { type: 'subtract', value: 35, label: '-35' } },
            { y: 3000, left: { type: 'shield' },                               right: { type: 'divide', value: 3, label: '÷3' } },
            { y: 3700, left: { type: 'multiply', value: 2, label: '×2' },     right: { type: 'add', value: 40, label: '+40' } },
            { y: 4300, left: { type: 'multiply', value: 4, label: '×4' },     right: { type: 'subtract', value: 45, label: '-45' } },
        ],
        obstacles: [
            { y: 700, type: 'hammer', laneX: -0.5, speed: 4.0 },
            { y: 1350, type: 'saw', range: 0.8, speed: 4.5 },
            { y: 2000, type: 'pit', laneX: 0.5, width: 65 },
            { y: 2700, type: 'hammer', laneX: 0.4, speed: 4.0 },
            { y: 3400, type: 'saw', range: 0.9, speed: 5.0 }
        ],
        enemies: [
            { y: 2000, count: 90 },
            { y: 3500, count: 120, type: 'split_boss' },
            { y: 4500, count: 110 }
        ],
        fortress: { hp: 700, phases: [
            { hp: 350, label: 'Steel Gate', theme: 'city' },
            { hp: 250, label: 'HQ Lobby', theme: 'dark' },
            { hp: 100, label: 'Cyber Mech', theme: 'boss' }
        ]}, hasBranching: true,
    },
    {
        id: 6, name: 'Cyber Underpass', world: 2, theme: 'city', startCrowd: 10, laneLength: 5400,
        gates: [
            { y: 450,  left: { type: 'multiply', value: 3, label: '×3' },     right: { type: 'divide', value: 3, label: '÷3' } },
            { y: 1100, left: { type: 'subtract', value: 25, label: '-25' },   right: { type: 'multiply', value: 4, label: '×4' } },
            { y: 1800, left: { type: 'shield' },                               right: { type: 'subtract', value: 30, label: '-30' } },
            { y: 2500, left: { type: 'multiply', value: 3, label: '×3' },     right: { type: 'divide', value: 2, label: '÷2' } },
            { y: 3200, left: { type: 'golden' },                               right: { type: 'subtract', value: 40, label: '-40' } },
            { y: 3900, left: { type: 'multiply', value: 5, label: '×5' },     right: { type: 'divide', value: 4, label: '÷4' } },
            { y: 4600, left: { type: 'explode' },                              right: { type: 'subtract', value: 50, label: '-50' } },
        ],
        obstacles: [
            { y: 800, type: 'saw', range: 0.9, speed: 5.0 },
            { y: 1450, type: 'hammer', laneX: -0.6, speed: 4.5 },
            { y: 2150, type: 'pit', laneX: -0.2, width: 70 },
            { y: 2850, type: 'saw', range: 0.8, speed: 5.2 },
            { y: 3550, type: 'hammer', laneX: 0.6, speed: 4.5 },
            { y: 4250, type: 'pit', laneX: 0.4, width: 70 }
        ],
        enemies: [
            { y: 2200, count: 100 },
            { y: 3600, count: 160, type: 'split_boss' },
            { y: 4900, count: 140 }
        ],
        fortress: { hp: 900, phases: [
            { hp: 450, label: 'Underground Vault', theme: 'city' },
            { hp: 300, label: 'Control Room', theme: 'dark' },
            { hp: 150, label: 'Security Commander', theme: 'boss' }
        ]}, hasBranching: true,
    },

    // ===================== WORLD 3: DESERT CANYON =====================
    {
        id: 7, name: 'Sand Dunes', world: 3, theme: 'desert', startCrowd: 10, laneLength: 5800,
        gates: [
            { y: 450,  left: { type: 'multiply', value: 2, label: '×2' },     right: { type: 'add', value: 15, label: '+15' } },
            { y: 1000, left: { type: 'divide', value: 3, label: '÷3' },       right: { type: 'multiply', value: 3, label: '×3' } },
            { y: 1600, left: { type: 'add', value: 20, label: '+20' },        right: { type: 'subtract', value: 30, label: '-30' } },
            { y: 2200, left: { type: 'multiply', value: 3, label: '×3' },     right: { type: 'divide', value: 2, label: '÷2' } },
            { y: 2800, left: { type: 'explode' },                              right: { type: 'subtract', value: 35, label: '-35' } },
            { y: 3400, left: { type: 'multiply', value: 2, label: '×2' },     right: { type: 'add', value: 50, label: '+50' } },
            { y: 4000, left: { type: 'golden' },                               right: { type: 'multiply', value: 4, label: '×4' } },
            { y: 4700, left: { type: 'multiply', value: 5, label: '×5' },     right: { type: 'subtract', value: 60, label: '-60' } },
        ],
        obstacles: [
            { y: 750, type: 'saw', range: 0.9, speed: 4.5 },
            { y: 1350, type: 'hammer', laneX: -0.5, speed: 4.0 },
            { y: 1950, type: 'pit', laneX: 0.3, width: 65, isLava: true },
            { y: 2550, type: 'saw', range: 0.8, speed: 5.0 },
            { y: 3150, type: 'hammer', laneX: 0.5, speed: 4.0 },
            { y: 3750, type: 'pit', laneX: -0.4, width: 70, isLava: true },
            { y: 4350, type: 'saw', range: 0.9, speed: 5.5 }
        ],
        enemies: [
            { y: 2500, count: 120 },
            { y: 3800, count: 180, type: 'split_boss' },
            { y: 5200, count: 160 }
        ],
        fortress: { hp: 1100, phases: [
            { hp: 600, label: 'Sand Fort', theme: 'desert' },
            { hp: 500, label: 'Pyramid Core', theme: 'dark' }
        ]}, hasBranching: true,
    },
    {
        id: 8, name: 'Canyon Gorge', world: 3, theme: 'desert', startCrowd: 10, laneLength: 6200,
        gates: [
            { y: 450,  left: { type: 'multiply', value: 2, label: '×2' },     right: { type: 'add', value: 15, label: '+15' } },
            { y: 1000, left: { type: 'divide', value: 3, label: '÷3' },       right: { type: 'multiply', value: 3, label: '×3' } },
            { y: 1600, left: { type: 'shield' },                               right: { type: 'subtract', value: 35, label: '-35' } },
            { y: 2200, left: { type: 'multiply', value: 3, label: '×3' },     right: { type: 'divide', value: 2, label: '÷2' } },
            { y: 2800, left: { type: 'subtract', value: 30, label: '-30' },   right: { type: 'multiply', value: 3, label: '×3' } },
            { y: 3400, left: { type: 'multiply', value: 2, label: '×2' },     right: { type: 'add', value: 50, label: '+50' } },
            { y: 4000, left: { type: 'divide', value: 2, label: '÷2' },       right: { type: 'multiply', value: 4, label: '×4' } },
            { y: 4600, left: { type: 'multiply', value: 3, label: '×3' },     right: { type: 'subtract', value: 50, label: '-50' } },
            { y: 5300, left: { type: 'golden' },                               right: { type: 'explode' } },
        ],
        obstacles: [
            { y: 700, type: 'saw', range: 0.9, speed: 5.0 },
            { y: 1300, type: 'pit', laneX: -0.5, width: 70, isLava: true },
            { y: 1900, type: 'hammer', laneX: 0.6, speed: 4.5 },
            { y: 2500, type: 'saw', range: 0.8, speed: 5.2 },
            { y: 3100, type: 'pit', laneX: 0.3, width: 75, isLava: true },
            { y: 3700, type: 'hammer', laneX: -0.6, speed: 4.5 },
            { y: 4300, type: 'saw', range: 0.9, speed: 5.5 },
            { y: 4900, type: 'pit', laneX: -0.2, width: 80, isLava: true }
        ],
        enemies: [
            { y: 2500, count: 140 },
            { y: 3800, count: 200, type: 'split_boss' },
            { y: 5500, count: 220 }
        ],
        fortress: { hp: 1300, phases: [
            { hp: 500, label: 'Stone Rampart', theme: 'desert' },
            { hp: 500, label: 'Canyon Keep', theme: 'dark' },
            { hp: 300, label: 'Desert Warlord', theme: 'boss' }
        ]}, hasBranching: true,
    },
    {
        id: 9, name: 'Sunken Temple', world: 3, theme: 'desert', startCrowd: 10, laneLength: 6600,
        gates: [
            { y: 450,  left: { type: 'multiply', value: 3, label: '×3' },     right: { type: 'subtract', value: 25, label: '-25' } },
            { y: 1100, left: { type: 'divide', value: 3, label: '÷3' },       right: { type: 'multiply', value: 4, label: '×4' } },
            { y: 1800, left: { type: 'golden' },                               right: { type: 'subtract', value: 40, label: '-40' } },
            { y: 2500, left: { type: 'multiply', value: 4, label: '×4' },     right: { type: 'divide', value: 3, label: '÷3' } },
            { y: 3200, left: { type: 'shield' },                               right: { type: 'subtract', value: 60, label: '-60' } },
            { y: 3900, left: { type: 'multiply', value: 3, label: '×3' },     right: { type: 'add', value: 60, label: '+60' } },
            { y: 4600, left: { type: 'explode' },                              right: { type: 'divide', value: 4, label: '÷4' } },
            { y: 5300, left: { type: 'multiply', value: 5, label: '×5' },     right: { type: 'subtract', value: 70, label: '-70' } },
            { y: 6000, left: { type: 'multiply', value: 6, label: '×6' },     right: { type: 'divide', value: 3, label: '÷3' } },
        ],
        obstacles: [
            { y: 800, type: 'hammer', laneX: -0.6, speed: 4.8 },
            { y: 1450, type: 'saw', range: 0.9, speed: 5.2 },
            { y: 2150, type: 'pit', laneX: 0.4, width: 75, isLava: true },
            { y: 2850, type: 'hammer', laneX: 0.6, speed: 4.8 },
            { y: 3550, type: 'saw', range: 0.8, speed: 5.5 },
            { y: 4250, type: 'pit', laneX: -0.3, width: 80, isLava: true },
            { y: 4950, type: 'saw', range: 0.9, speed: 5.8 }
        ],
        enemies: [
            { y: 2300, count: 160 },
            { y: 3800, count: 240, type: 'split_boss' },
            { y: 5800, count: 250 }
        ],
        fortress: { hp: 1500, phases: [
            { hp: 600, label: 'Temple Gates', theme: 'desert' },
            { hp: 600, label: 'Pharaoh Vault', theme: 'dark' },
            { hp: 300, label: 'Anubis Titan', theme: 'boss' }
        ]}, hasBranching: true,
    },

    // ===================== WORLD 4: VOLCANO CORE =====================
    {
        id: 10, name: 'Lava Fields', world: 4, theme: 'volcano', startCrowd: 10, laneLength: 6800,
        gates: [
            { y: 500,  left: { type: 'multiply', value: 3, label: '×3' },     right: { type: 'subtract', value: 25, label: '-25' } },
            { y: 1100, left: { type: 'add', value: 30, label: '+30' },        right: { type: 'divide', value: 3, label: '÷3' } },
            { y: 1700, left: { type: 'golden' },                               right: { type: 'subtract', value: 40, label: '-40' } },
            { y: 2400, left: { type: 'multiply', value: 4, label: '×4' },     right: { type: 'divide', value: 2, label: '÷2' } },
            { y: 3000, left: { type: 'shield' },                               right: { type: 'subtract', value: 60, label: '-60' } },
            { y: 3700, left: { type: 'multiply', value: 3, label: '×3' },     right: { type: 'add', value: 50, label: '+50' } },
            { y: 4300, left: { type: 'explode' },                              right: { type: 'divide', value: 4, label: '÷4' } },
            { y: 5000, left: { type: 'multiply', value: 5, label: '×5' },     right: { type: 'subtract', value: 75, label: '-75' } },
            { y: 5800, left: { type: 'multiply', value: 4, label: '×4' },     right: { type: 'divide', value: 3, label: '÷3' } },
        ],
        obstacles: [
            { y: 800, type: 'saw', range: 0.9, speed: 5.5 },
            { y: 1400, type: 'pit', laneX: -0.4, width: 80, isLava: true },
            { y: 2000, type: 'hammer', laneX: 0.6, speed: 5.0 },
            { y: 2700, type: 'saw', range: 0.8, speed: 5.8 },
            { y: 3300, type: 'pit', laneX: 0.4, width: 85, isLava: true },
            { y: 4000, type: 'hammer', laneX: -0.6, speed: 5.0 },
            { y: 4700, type: 'saw', range: 0.9, speed: 6.0 },
            { y: 5400, type: 'pit', laneX: 0.0, width: 90, isLava: true }
        ],
        enemies: [
            { y: 2200, count: 180, type: 'split_boss' },
            { y: 3800, count: 280 },
            { y: 5500, count: 260, type: 'split_boss' }
        ],
        fortress: { hp: 1800, phases: [
            { hp: 700, label: 'Lava Gate', theme: 'volcano' },
            { hp: 700, label: 'Fire Keep', theme: 'dark' },
            { hp: 400, label: 'Volcano Lord', theme: 'boss' }
        ]}, hasBranching: true,
    },
    {
        id: 11, name: 'Magma Core', world: 4, theme: 'volcano', startCrowd: 10, laneLength: 7200,
        gates: [
            { y: 500,  left: { type: 'multiply', value: 3, label: '×3' },     right: { type: 'subtract', value: 30, label: '-30' } },
            { y: 1100, left: { type: 'golden' },                               right: { type: 'divide', value: 3, label: '÷3' } },
            { y: 1800, left: { type: 'multiply', value: 4, label: '×4' },     right: { type: 'subtract', value: 45, label: '-45' } },
            { y: 2500, left: { type: 'shield' },                               right: { type: 'divide', value: 2, label: '÷2' } },
            { y: 3200, left: { type: 'multiply', value: 3, label: '×3' },     right: { type: 'subtract', value: 60, label: '-60' } },
            { y: 3900, left: { type: 'explode' },                              right: { type: 'multiply', value: 4, label: '×4' } },
            { y: 4600, left: { type: 'multiply', value: 5, label: '×5' },     right: { type: 'subtract', value: 80, label: '-80' } },
            { y: 5400, left: { type: 'golden' },                               right: { type: 'divide', value: 4, label: '÷4' } },
            { y: 6200, left: { type: 'multiply', value: 5, label: '×5' },     right: { type: 'shield' } },
        ],
        obstacles: [
            { y: 800, type: 'hammer', laneX: -0.6, speed: 5.2 },
            { y: 1450, type: 'saw', range: 0.9, speed: 5.8 },
            { y: 2150, type: 'pit', laneX: 0.5, width: 85, isLava: true },
            { y: 2850, type: 'hammer', laneX: 0.6, speed: 5.2 },
            { y: 3550, type: 'saw', range: 0.8, speed: 6.0 },
            { y: 4250, type: 'pit', laneX: -0.4, width: 90, isLava: true },
            { y: 4950, type: 'saw', range: 0.9, speed: 6.2 },
            { y: 5700, type: 'hammer', laneX: -0.5, speed: 5.5 }
        ],
        enemies: [
            { y: 2000, count: 200, type: 'split_boss' },
            { y: 3600, count: 320 },
            { y: 5200, count: 300, type: 'split_boss' },
            { y: 6500, count: 280 }
        ],
        fortress: { hp: 2200, phases: [
            { hp: 900, label: 'Obsidian Wall', theme: 'volcano' },
            { hp: 800, label: 'Magma Keep', theme: 'dark' },
            { hp: 500, label: 'Fire Titan', theme: 'boss' }
        ]}, hasBranching: true,
    },
    {
        id: 12, name: 'Hellfire Ridge', world: 4, theme: 'volcano', startCrowd: 10, laneLength: 7600,
        gates: [
            { y: 500,  left: { type: 'multiply', value: 4, label: '×4' },     right: { type: 'divide', value: 3, label: '÷3' } },
            { y: 1200, left: { type: 'subtract', value: 35, label: '-35' },   right: { type: 'multiply', value: 3, label: '×3' } },
            { y: 1900, left: { type: 'shield' },                               right: { type: 'divide', value: 4, label: '÷4' } },
            { y: 2600, left: { type: 'multiply', value: 5, label: '×5' },     right: { type: 'subtract', value: 60, label: '-60' } },
            { y: 3300, left: { type: 'golden' },                               right: { type: 'divide', value: 2, label: '÷2' } },
            { y: 4000, left: { type: 'multiply', value: 4, label: '×4' },     right: { type: 'subtract', value: 80, label: '-80' } },
            { y: 4700, left: { type: 'explode' },                              right: { type: 'multiply', value: 6, label: '×6' } },
            { y: 5500, left: { type: 'multiply', value: 6, label: '×6' },     right: { type: 'divide', value: 4, label: '÷4' } },
            { y: 6400, left: { type: 'golden' },                               right: { type: 'subtract', value: 100, label: '-100' } },
        ],
        obstacles: [
            { y: 850, type: 'saw', range: 0.9, speed: 6.0 },
            { y: 1550, type: 'pit', laneX: -0.5, width: 90, isLava: true },
            { y: 2250, type: 'hammer', laneX: 0.6, speed: 5.5 },
            { y: 2950, type: 'saw', range: 0.8, speed: 6.2 },
            { y: 3650, type: 'pit', laneX: 0.4, width: 95, isLava: true },
            { y: 4350, type: 'hammer', laneX: -0.6, speed: 5.5 },
            { y: 5050, type: 'saw', range: 0.9, speed: 6.5 },
            { y: 5850, type: 'pit', laneX: 0.0, width: 100, isLava: true }
        ],
        enemies: [
            { y: 2200, count: 240, type: 'split_boss' },
            { y: 3800, count: 360 },
            { y: 5400, count: 350, type: 'split_boss' },
            { y: 6800, count: 320 }
        ],
        fortress: { hp: 2600, phases: [
            { hp: 1000, label: 'Infernal Bastion', theme: 'volcano' },
            { hp: 1000, label: 'Core Chamber', theme: 'dark' },
            { hp: 600, label: 'Demon Lord', theme: 'boss' }
        ]}, hasBranching: true,
    },
    {
        id: 13, name: 'Ashen Crater', world: 4, theme: 'volcano', startCrowd: 10, laneLength: 8000,
        gates: [
            { y: 500,  left: { type: 'multiply', value: 4, label: '×4' },     right: { type: 'subtract', value: 40, label: '-40' } },
            { y: 1200, left: { type: 'golden' },                               right: { type: 'divide', value: 3, label: '÷3' } },
            { y: 2000, left: { type: 'multiply', value: 5, label: '×5' },     right: { type: 'subtract', value: 70, label: '-70' } },
            { y: 2800, left: { type: 'shield' },                               right: { type: 'divide', value: 4, label: '÷4' } },
            { y: 3600, left: { type: 'multiply', value: 4, label: '×4' },     right: { type: 'subtract', value: 90, label: '-90' } },
            { y: 4400, left: { type: 'explode' },                              right: { type: 'multiply', value: 6, label: '×6' } },
            { y: 5200, left: { type: 'multiply', value: 6, label: '×6' },     right: { type: 'divide', value: 3, label: '÷3' } },
            { y: 6000, left: { type: 'golden' },                               right: { type: 'subtract', value: 120, label: '-120' } },
            { y: 6900, left: { type: 'multiply', value: 7, label: '×7' },     right: { type: 'shield' } },
        ],
        obstacles: [
            { y: 850, type: 'hammer', laneX: -0.6, speed: 5.8 },
            { y: 1600, type: 'saw', range: 0.9, speed: 6.5 },
            { y: 2400, type: 'pit', laneX: 0.5, width: 95, isLava: true },
            { y: 3200, type: 'hammer', laneX: 0.6, speed: 5.8 },
            { y: 4000, type: 'saw', range: 0.8, speed: 6.8 },
            { y: 4800, type: 'pit', laneX: -0.4, width: 100, isLava: true },
            { y: 5600, type: 'saw', range: 0.9, speed: 7.0 },
            { y: 6400, type: 'hammer', laneX: -0.5, speed: 6.0 }
        ],
        enemies: [
            { y: 2400, count: 280, type: 'split_boss' },
            { y: 4200, count: 400 },
            { y: 5800, count: 380, type: 'split_boss' },
            { y: 7200, count: 350 }
        ],
        fortress: { hp: 3000, phases: [
            { hp: 1200, label: 'Crater Gate', theme: 'volcano' },
            { hp: 1000, label: 'Magma Heart', theme: 'dark' },
            { hp: 800, label: 'Crater Behemoth', theme: 'boss' }
        ]}, hasBranching: true,
    },

    // ===================== WORLD 5: NEON CYBER =====================
    {
        id: 14, name: 'Cyber Grid', world: 5, theme: 'city', startCrowd: 8, laneLength: 8200,
        gates: [
            { y: 450,  left: { type: 'multiply', value: 4, label: '×4' },     right: { type: 'divide', value: 3, label: '÷3' } },
            { y: 1150, left: { type: 'subtract', value: 45, label: '-45' },   right: { type: 'multiply', value: 5, label: '×5' } },
            { y: 1900, left: { type: 'shield' },                               right: { type: 'divide', value: 4, label: '÷4' } },
            { y: 2650, left: { type: 'multiply', value: 5, label: '×5' },     right: { type: 'subtract', value: 80, label: '-80' } },
            { y: 3400, left: { type: 'golden' },                               right: { type: 'divide', value: 3, label: '÷3' } },
            { y: 4150, left: { type: 'multiply', value: 6, label: '×6' },     right: { type: 'subtract', value: 100, label: '-100' } },
            { y: 4900, left: { type: 'explode' },                              right: { type: 'multiply', value: 7, label: '×7' } },
            { y: 5700, left: { type: 'multiply', value: 7, label: '×7' },     right: { type: 'divide', value: 4, label: '÷4' } },
            { y: 6500, left: { type: 'golden' },                               right: { type: 'subtract', value: 130, label: '-130' } },
            { y: 7300, left: { type: 'multiply', value: 8, label: '×8' },     right: { type: 'divide', value: 3, label: '÷3' } },
        ],
        obstacles: [
            { y: 800, type: 'saw', range: 0.9, speed: 6.5 },
            { y: 1500, type: 'pit', laneX: -0.5, width: 85 },
            { y: 2250, type: 'hammer', laneX: 0.6, speed: 6.0 },
            { y: 3000, type: 'saw', range: 0.8, speed: 6.8 },
            { y: 3750, type: 'pit', laneX: 0.4, width: 90 },
            { y: 4500, type: 'hammer', laneX: -0.6, speed: 6.0 },
            { y: 5300, type: 'saw', range: 0.9, speed: 7.2 },
            { y: 6100, type: 'pit', laneX: 0.0, width: 95 }
        ],
        enemies: [
            { y: 2300, count: 300, type: 'split_boss' },
            { y: 4300, count: 450 },
            { y: 6000, count: 400, type: 'split_boss' },
            { y: 7400, count: 380 }
        ],
        fortress: { hp: 3500, phases: [
            { hp: 1500, label: 'Grid Wall', theme: 'city' },
            { hp: 1200, label: 'Mainframe Keep', theme: 'dark' },
            { hp: 800, label: 'Cyber Overlord', theme: 'boss' }
        ]}, hasBranching: true,
    },
    {
        id: 15, name: 'Matrix Nexus', world: 5, theme: 'city', startCrowd: 8, laneLength: 8600,
        gates: [
            { y: 450,  left: { type: 'multiply', value: 5, label: '×5' },     right: { type: 'subtract', value: 50, label: '-50' } },
            { y: 1200, left: { type: 'golden' },                               right: { type: 'divide', value: 4, label: '÷4' } },
            { y: 2000, left: { type: 'multiply', value: 6, label: '×6' },     right: { type: 'subtract', value: 90, label: '-90' } },
            { y: 2800, left: { type: 'shield' },                               right: { type: 'divide', value: 3, label: '÷3' } },
            { y: 3600, left: { type: 'multiply', value: 5, label: '×5' },     right: { type: 'subtract', value: 110, label: '-110' } },
            { y: 4400, left: { type: 'explode' },                              right: { type: 'multiply', value: 7, label: '×7' } },
            { y: 5200, left: { type: 'multiply', value: 7, label: '×7' },     right: { type: 'divide', value: 4, label: '÷4' } },
            { y: 6000, left: { type: 'golden' },                               right: { type: 'subtract', value: 140, label: '-140' } },
            { y: 6800, left: { type: 'multiply', value: 8, label: '×8' },     right: { type: 'divide', value: 3, label: '÷3' } },
            { y: 7700, left: { type: 'multiply', value: 9, label: '×9' },     right: { type: 'shield' } },
        ],
        obstacles: [
            { y: 800, type: 'hammer', laneX: -0.6, speed: 6.2 },
            { y: 1600, type: 'saw', range: 0.9, speed: 7.0 },
            { y: 2400, type: 'pit', laneX: 0.5, width: 95 },
            { y: 3200, type: 'hammer', laneX: 0.6, speed: 6.2 },
            { y: 4000, type: 'saw', range: 0.8, speed: 7.2 },
            { y: 4800, type: 'pit', laneX: -0.4, width: 100 },
            { y: 5600, type: 'saw', range: 0.9, speed: 7.5 },
            { y: 6400, type: 'hammer', laneX: -0.5, speed: 6.5 }
        ],
        enemies: [
            { y: 2400, count: 320, type: 'split_boss' },
            { y: 4400, count: 480 },
            { y: 6200, count: 420, type: 'split_boss' },
            { y: 7800, count: 400 }
        ],
        fortress: { hp: 3800, phases: [
            { hp: 1500, label: 'Nexus Rampart', theme: 'city' },
            { hp: 1300, label: 'Core Server', theme: 'dark' },
            { hp: 1000, label: 'Matrix AI Boss', theme: 'boss' }
        ]}, hasBranching: true,
    },
    {
        id: 16, name: 'Overclock Sector', world: 5, theme: 'city', startCrowd: 8, laneLength: 9000,
        gates: [
            { y: 500,  left: { type: 'multiply', value: 5, label: '×5' },     right: { type: 'divide', value: 4, label: '÷4' } },
            { y: 1300, left: { type: 'subtract', value: 60, label: '-60' },   right: { type: 'multiply', value: 6, label: '×6' } },
            { y: 2100, left: { type: 'shield' },                               right: { type: 'divide', value: 3, label: '÷3' } },
            { y: 2900, left: { type: 'multiply', value: 6, label: '×6' },     right: { type: 'subtract', value: 120, label: '-120' } },
            { y: 3700, left: { type: 'golden' },                               right: { type: 'divide', value: 4, label: '÷4' } },
            { y: 4500, left: { type: 'multiply', value: 7, label: '×7' },     right: { type: 'subtract', value: 140, label: '-140' } },
            { y: 5300, left: { type: 'explode' },                              right: { type: 'multiply', value: 8, label: '×8' } },
            { y: 6100, left: { type: 'multiply', value: 8, label: '×8' },     right: { type: 'divide', value: 3, label: '÷3' } },
            { y: 7000, left: { type: 'golden' },                               right: { type: 'subtract', value: 160, label: '-160' } },
            { y: 8000, left: { type: 'multiply', value: 9, label: '×9' },     right: { type: 'divide', value: 4, label: '÷4' } },
        ],
        obstacles: [
            { y: 900, type: 'saw', range: 0.9, speed: 7.2 },
            { y: 1700, type: 'pit', laneX: -0.5, width: 100 },
            { y: 2500, type: 'hammer', laneX: 0.6, speed: 6.8 },
            { y: 3300, type: 'saw', range: 0.8, speed: 7.5 },
            { y: 4100, type: 'pit', laneX: 0.4, width: 105 },
            { y: 4900, type: 'hammer', laneX: -0.6, speed: 6.8 },
            { y: 5700, type: 'saw', range: 0.9, speed: 7.8 },
            { y: 6500, type: 'pit', laneX: 0.0, width: 110 }
        ],
        enemies: [
            { y: 2600, count: 350, type: 'split_boss' },
            { y: 4600, count: 500 },
            { y: 6400, count: 450, type: 'split_boss' },
            { y: 8200, count: 420 }
        ],
        fortress: { hp: 4200, phases: [
            { hp: 1600, label: 'Sector Barrier', theme: 'city' },
            { hp: 1400, label: 'Reactor Room', theme: 'dark' },
            { hp: 1200, label: 'Overclock Mech', theme: 'boss' }
        ]}, hasBranching: true,
    },
    {
        id: 17, name: 'Neon Apocalypse', world: 5, theme: 'city', startCrowd: 8, laneLength: 9400,
        gates: [
            { y: 500,  left: { type: 'multiply', value: 6, label: '×6' },     right: { type: 'subtract', value: 70, label: '-70' } },
            { y: 1350, left: { type: 'golden' },                               right: { type: 'divide', value: 4, label: '÷4' } },
            { y: 2200, left: { type: 'multiply', value: 7, label: '×7' },     right: { type: 'subtract', value: 130, label: '-130' } },
            { y: 3050, left: { type: 'shield' },                               right: { type: 'divide', value: 3, label: '÷3' } },
            { y: 3900, left: { type: 'multiply', value: 6, label: '×6' },     right: { type: 'subtract', value: 150, label: '-150' } },
            { y: 4750, left: { type: 'explode' },                              right: { type: 'multiply', value: 8, label: '×8' } },
            { y: 5600, left: { type: 'multiply', value: 8, label: '×8' },     right: { type: 'divide', value: 4, label: '÷4' } },
            { y: 6450, left: { type: 'golden' },                               right: { type: 'subtract', value: 180, label: '-180' } },
            { y: 7300, left: { type: 'multiply', value: 9, label: '×9' },     right: { type: 'divide', value: 3, label: '÷3' } },
            { y: 8300, left: { type: 'multiply', value: 10, label: '×10' },   right: { type: 'shield' } },
        ],
        obstacles: [
            { y: 900, type: 'hammer', laneX: -0.6, speed: 7.0 },
            { y: 1750, type: 'saw', range: 0.9, speed: 7.5 },
            { y: 2600, type: 'pit', laneX: 0.5, width: 105 },
            { y: 3450, type: 'hammer', laneX: 0.6, speed: 7.0 },
            { y: 4300, type: 'saw', range: 0.8, speed: 7.8 },
            { y: 5150, type: 'pit', laneX: -0.4, width: 110 },
            { y: 6000, type: 'saw', range: 0.9, speed: 8.0 },
            { y: 6850, type: 'hammer', laneX: -0.5, speed: 7.2 }
        ],
        enemies: [
            { y: 2700, count: 380, type: 'split_boss' },
            { y: 4800, count: 550 },
            { y: 6600, count: 500, type: 'split_boss' },
            { y: 8500, count: 480 }
        ],
        fortress: { hp: 4500, phases: [
            { hp: 1800, label: 'Apocalypse Gate', theme: 'city' },
            { hp: 1500, label: 'Dark Core', theme: 'dark' },
            { hp: 1200, label: 'Apocalypse Titan', theme: 'boss' }
        ]}, hasBranching: true,
    },

    // ===================== WORLD 6: OBSIDIAN REALM =====================
    {
        id: 18, name: 'Obsidian Spire', world: 6, theme: 'volcano', startCrowd: 6, laneLength: 9600,
        gates: [
            { y: 500,  left: { type: 'multiply', value: 6, label: '×6' },     right: { type: 'divide', value: 4, label: '÷4' } },
            { y: 1350, left: { type: 'subtract', value: 80, label: '-80' },   right: { type: 'multiply', value: 7, label: '×7' } },
            { y: 2200, left: { type: 'shield' },                               right: { type: 'divide', value: 3, label: '÷3' } },
            { y: 3050, left: { type: 'multiply', value: 7, label: '×7' },     right: { type: 'subtract', value: 140, label: '-140' } },
            { y: 3900, left: { type: 'golden' },                               right: { type: 'divide', value: 4, label: '÷4' } },
            { y: 4750, left: { type: 'multiply', value: 8, label: '×8' },     right: { type: 'subtract', value: 160, label: '-160' } },
            { y: 5600, left: { type: 'explode' },                              right: { type: 'multiply', value: 9, label: '×9' } },
            { y: 6450, left: { type: 'multiply', value: 9, label: '×9' },     right: { type: 'divide', value: 3, label: '÷3' } },
            { y: 7300, left: { type: 'golden' },                               right: { type: 'subtract', value: 200, label: '-200' } },
            { y: 8400, left: { type: 'multiply', value: 10, label: '×10' },   right: { type: 'divide', value: 4, label: '÷4' } },
        ],
        obstacles: [
            { y: 900, type: 'saw', range: 0.9, speed: 7.8 },
            { y: 1750, type: 'pit', laneX: -0.5, width: 110, isLava: true },
            { y: 2600, type: 'hammer', laneX: 0.6, speed: 7.2 },
            { y: 3450, type: 'saw', range: 0.8, speed: 8.0 },
            { y: 4300, type: 'pit', laneX: 0.4, width: 115, isLava: true },
            { y: 5150, type: 'hammer', laneX: -0.6, speed: 7.2 },
            { y: 6000, type: 'saw', range: 0.9, speed: 8.2 },
            { y: 6850, type: 'pit', laneX: 0.0, width: 120, isLava: true }
        ],
        enemies: [
            { y: 2700, count: 400, type: 'split_boss' },
            { y: 4800, count: 600 },
            { y: 6600, count: 550, type: 'split_boss' },
            { y: 8600, count: 500 }
        ],
        fortress: { hp: 4800, phases: [
            { hp: 1800, label: 'Obsidian Barrier', theme: 'volcano' },
            { hp: 1500, label: 'Inner Sanctum', theme: 'dark' },
            { hp: 1500, label: 'Spire Dragon', theme: 'boss' }
        ]}, hasBranching: true,
    },
    {
        id: 19, name: 'Chaos Citadel', world: 6, theme: 'volcano', startCrowd: 6, laneLength: 10000,
        gates: [
            { y: 500,  left: { type: 'multiply', value: 7, label: '×7' },     right: { type: 'subtract', value: 90, label: '-90' } },
            { y: 1400, left: { type: 'golden' },                               right: { type: 'divide', value: 4, label: '÷4' } },
            { y: 2300, left: { type: 'multiply', value: 8, label: '×8' },     right: { type: 'subtract', value: 150, label: '-150' } },
            { y: 3200, left: { type: 'shield' },                               right: { type: 'divide', value: 4, label: '÷4' } },
            { y: 4100, left: { type: 'multiply', value: 7, label: '×7' },     right: { type: 'subtract', value: 180, label: '-180' } },
            { y: 5000, left: { type: 'explode' },                              right: { type: 'multiply', value: 9, label: '×9' } },
            { y: 5900, left: { type: 'multiply', value: 9, label: '×9' },     right: { type: 'divide', value: 4, label: '÷4' } },
            { y: 6800, left: { type: 'golden' },                               right: { type: 'subtract', value: 220, label: '-220' } },
            { y: 7700, left: { type: 'multiply', value: 10, label: '×10' },   right: { type: 'divide', value: 3, label: '÷3' } },
            { y: 8800, left: { type: 'multiply', value: 12, label: '×12' },   right: { type: 'shield' } },
        ],
        obstacles: [
            { y: 950, type: 'hammer', laneX: -0.6, speed: 7.5 },
            { y: 1850, type: 'saw', range: 0.9, speed: 8.2 },
            { y: 2750, type: 'pit', laneX: 0.5, width: 115, isLava: true },
            { y: 3650, type: 'hammer', laneX: 0.6, speed: 7.5 },
            { y: 4550, type: 'saw', range: 0.8, speed: 8.5 },
            { y: 5450, type: 'pit', laneX: -0.4, width: 120, isLava: true },
            { y: 6350, type: 'saw', range: 0.9, speed: 8.8 },
            { y: 7250, type: 'hammer', laneX: -0.5, speed: 7.8 }
        ],
        enemies: [
            { y: 2800, count: 450, type: 'split_boss' },
            { y: 5000, count: 650 },
            { y: 7000, count: 600, type: 'split_boss' },
            { y: 9000, count: 550 }
        ],
        fortress: { hp: 5000, phases: [
            { hp: 2000, label: 'Citadel Gate', theme: 'volcano' },
            { hp: 1500, label: 'Throne Room', theme: 'dark' },
            { hp: 1500, label: 'Chaos Overlord', theme: 'boss' }
        ]}, hasBranching: true,
    },
    {
        id: 20, name: 'The Ultimate Clash', world: 6, theme: 'volcano', startCrowd: 5, laneLength: 10500,
        gates: [
            { y: 500,  left: { type: 'multiply', value: 8, label: '×8' },     right: { type: 'subtract', value: 100, label: '-100' } },
            { y: 1400, left: { type: 'golden' },                               right: { type: 'divide', value: 4, label: '÷4' } },
            { y: 2300, left: { type: 'multiply', value: 9, label: '×9' },     right: { type: 'subtract', value: 180, label: '-180' } },
            { y: 3200, left: { type: 'shield' },                               right: { type: 'divide', value: 4, label: '÷4' } },
            { y: 4100, left: { type: 'multiply', value: 8, label: '×8' },     right: { type: 'subtract', value: 200, label: '-200' } },
            { y: 5000, left: { type: 'explode' },                              right: { type: 'multiply', value: 10, label: '×10' } },
            { y: 5900, left: { type: 'multiply', value: 10, label: '×10' },   right: { type: 'divide', value: 4, label: '÷4' } },
            { y: 6800, left: { type: 'golden' },                               right: { type: 'subtract', value: 250, label: '-250' } },
            { y: 7700, left: { type: 'multiply', value: 12, label: '×12' },   right: { type: 'divide', value: 3, label: '÷3' } },
            { y: 8700, left: { type: 'multiply', value: 15, label: '×15' },   right: { type: 'shield' } },
            { y: 9600, left: { type: 'golden' },                               right: { type: 'subtract', value: 300, label: '-300' } },
        ],
        obstacles: [
            { y: 950, type: 'saw', range: 0.9, speed: 8.5 },
            { y: 1850, type: 'pit', laneX: -0.5, width: 120, isLava: true },
            { y: 2750, type: 'hammer', laneX: 0.6, speed: 8.0 },
            { y: 3650, type: 'saw', range: 0.8, speed: 8.8 },
            { y: 4550, type: 'pit', laneX: 0.4, width: 125, isLava: true },
            { y: 5450, type: 'hammer', laneX: -0.6, speed: 8.0 },
            { y: 6350, type: 'saw', range: 0.9, speed: 9.0 },
            { y: 7250, type: 'pit', laneX: 0.0, width: 130, isLava: true },
            { y: 8150, type: 'hammer', laneX: 0.5, speed: 8.2 },
            { y: 9050, type: 'saw', range: 0.9, speed: 9.2 }
        ],
        enemies: [
            { y: 2800, count: 500, type: 'split_boss' },
            { y: 4800, count: 750 },
            { y: 6800, count: 700, type: 'split_boss' },
            { y: 8500, count: 650, type: 'split_boss' },
            { y: 9600, count: 800 }
        ],
        fortress: { hp: 5000, phases: [
            { hp: 1500, label: 'Iron Barrier', theme: 'volcano' },
            { hp: 1500, label: 'Dark Citadel', theme: 'dark' },
            { hp: 1000, label: 'Obsidian Emperor', theme: 'boss' },
            { hp: 1000, label: 'Final Core', theme: 'boss' }
        ]}, hasBranching: true,
    },
];

// World metadata for World Map UI
const WORLDS = [
    { id: 1, name: 'Green Meadow', levels: [1, 2, 3], theme: 'meadow', emoji: '🌿' },
    { id: 2, name: 'City Streets', levels: [4, 5, 6], theme: 'city', emoji: '🌆' },
    { id: 3, name: 'Desert Canyon', levels: [7, 8, 9], theme: 'desert', emoji: '🏜️' },
    { id: 4, name: 'Volcano Core', levels: [10, 11, 12, 13], theme: 'volcano', emoji: '🌋' },
    { id: 5, name: 'Neon Cyber', levels: [14, 15, 16, 17], theme: 'city', emoji: '⚡' },
    { id: 6, name: 'Obsidian Realm', levels: [18, 19, 20], theme: 'volcano', emoji: '💀' },
];
