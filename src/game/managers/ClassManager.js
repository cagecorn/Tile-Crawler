export class ClassManager {
    constructor(statManager) {
        this.statManager = statManager;
        this.classes = {
            warrior: {
                key: 'warrior',
                displayName: '전사',
                stats: {
                    health: 160,
                    attack: 16,
                    defense: 12,
                    mobility: 4,
                    actionSpeed: 10,
                    sightRange: 10
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
