export class ClassManager {
    constructor(statManager) {
        this.statManager = statManager;
        this.classes = {
            warrior: {
                key: 'warrior',
                displayName: '전사',
                stats: {
                    health: 160,
                    mana: 50,
                    attack: 16,
                    defense: 12,
                    mobility: 4,
                    actionSpeed: 10,
                    sightRange: 10,
                    level: 1,
                    experience: 0,
                    magicAttack: 8,
                    magicDefense: 14,
                    evasion: 12,
                    accuracy: 92,
                    actionPoints: 2,
                    movePoints: 4,
                    critChance: 12
                }
            }
        };
    }

    createStatsForClass(classKey) {
        const classConfig = this.classes[classKey];
        const overrides = classConfig?.stats ?? {};
        return this.statManager.createStats(overrides);
    }
}
