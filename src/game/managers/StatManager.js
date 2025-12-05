const DEFAULT_STATS = {
    health: 120,
    mana: 80,
    attack: 12,
    defense: 8,
    mobility: 4,
    actionSpeed: 8,
    sightRange: 8,
    level: 1,
    experience: 0,
    magicAttack: 10,
    magicDefense: 8,
    evasion: 5,
    accuracy: 85,
    actionPoints: 2,
    movePoints: 4,
    critChance: 10
};

export class StatManager {
    constructor(baseStats = DEFAULT_STATS) {
        this.baseStats = baseStats;
    }

    createStats(overrides = {}) {
        const merged = { ...this.baseStats, ...overrides };
        return {
            health: merged.health,
            maxHealth: merged.health,
            mana: merged.mana,
            maxMana: merged.mana,
            attack: merged.attack,
            defense: merged.defense,
            mobility: merged.mobility,
            actionSpeed: merged.actionSpeed,
            sightRange: merged.sightRange,
            level: merged.level,
            experience: merged.experience,
            magicAttack: merged.magicAttack,
            magicDefense: merged.magicDefense,
            evasion: merged.evasion,
            accuracy: merged.accuracy,
            actionPoints: merged.actionPoints,
            movePoints: merged.movePoints,
            critChance: merged.critChance
        };
    }
}

export { DEFAULT_STATS };
