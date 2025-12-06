function createMockUnit({ name, currentHealth, maxHealth, currentMana, maxMana, healthRegen, manaRegen }) {
    return {
        name,
        stats: { healthRegen, manaRegen },
        currentHealth,
        maxHealth,
        currentMana,
        maxMana,
        setHealth(value) {
            this.currentHealth = Math.max(0, Math.min(value, this.maxHealth));
        },
        setMana(value) {
            this.currentMana = Math.max(0, Math.min(value, this.maxMana));
        },
        isAlive() {
            return this.currentHealth > 0;
        },
        getHealthState() {
            return { current: this.currentHealth, max: this.maxHealth };
        },
        getName() {
            return this.name;
        }
    };
}

export function runDebugRegenTest({ regenManager } = {}) {
    if (!regenManager) {
        return { success: false, reason: 'regenManager missing' };
    }

    const units = [
        createMockUnit({
            name: '플레이어',
            currentHealth: 120,
            maxHealth: 160,
            currentMana: 22,
            maxMana: 50,
            healthRegen: 4,
            manaRegen: 2
        }),
        createMockUnit({
            name: '센티넬',
            currentHealth: 180,
            maxHealth: 240,
            currentMana: 18,
            maxMana: 40,
            healthRegen: 5,
            manaRegen: 1
        }),
        createMockUnit({
            name: '좀비',
            currentHealth: 80,
            maxHealth: 110,
            currentMana: 0,
            maxMana: 0,
            healthRegen: 1,
            manaRegen: 0
        })
    ];

    const expectations = [
        { name: '플레이어', health: 124, mana: 24 },
        { name: '센티넬', health: 185, mana: 19 },
        { name: '좀비', health: 81, mana: 0 }
    ];

    regenManager.applyRegen(units);

    const results = units.map((unit) => {
        const expected = expectations.find((entry) => entry.name === unit.name);
        const matches = expected && unit.currentHealth === expected.health && unit.currentMana === expected.mana;
        return { name: unit.name, matches, current: { health: unit.currentHealth, mana: unit.currentMana }, expected };
    });

    const success = results.every((result) => result.matches);

    return { success, results };
}
