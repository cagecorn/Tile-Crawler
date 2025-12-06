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
                    healthRegen: 4,
                    manaRegen: 2,
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
                    critChance: 12,
                    attackRange: 1
                }
            },
            sentinel: {
                key: 'sentinel',
                displayName: '센티넬',
                stats: {
                    health: 240,
                    mana: 40,
                    healthRegen: 5,
                    manaRegen: 1,
                    attack: 14,
                    defense: 20,
                    mobility: 3,
                    actionSpeed: 9,
                    sightRange: 9,
                    level: 1,
                    experience: 0,
                    magicAttack: 6,
                    magicDefense: 16,
                    evasion: 8,
                    accuracy: 90,
                    actionPoints: 2,
                    movePoints: 3,
                    critChance: 10,
                    attackRange: 1
                }
            },
            medic: {
                key: 'medic',
                displayName: '메딕',
                stats: {
                    health: 140,
                    mana: 120,
                    healthRegen: 4,
                    manaRegen: 6,
                    attack: 8,
                    defense: 8,
                    mobility: 4,
                    actionSpeed: 11,
                    sightRange: 11,
                    level: 1,
                    experience: 0,
                    magicAttack: 18,
                    magicDefense: 12,
                    evasion: 14,
                    accuracy: 96,
                    actionPoints: 2,
                    movePoints: 4,
                    critChance: 8,
                    attackRange: 1
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
