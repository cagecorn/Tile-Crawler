const DEFAULT_STATS = {
    health: 120,
    mana: 80,
    attack: 12,
    defense: 8,
    mobility: 4,
    actionSpeed: 8,
    sightRange: 8
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
            sightRange: merged.sightRange
        };
    }
}

export { DEFAULT_STATS };
