const DEFAULT_STATS = {
    health: 120,
    attack: 12,
    defense: 8,
    mobility: 4
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
            attack: merged.attack,
            defense: merged.defense,
            mobility: merged.mobility
        };
    }
}

export { DEFAULT_STATS };
