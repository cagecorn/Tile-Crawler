import { ActionOrderEngine } from './ActionOrderEngine.js';

export class CombatEngine {
    constructor(turnEngine, specialEffectManager) {
        this.turnEngine = turnEngine;
        this.specialEffectManager = specialEffectManager;
        this.actionOrderEngine = new ActionOrderEngine();
    }

    async resolveEngagement(unitA, unitB) {
        const attackers = this.actionOrderEngine.orderUnits([unitA, unitB]);

        for (const attacker of attackers) {
            const defender = attacker === unitA ? unitB : unitA;
            if (!attacker.isAlive() || !defender.isAlive()) {
                continue;
            }
            const damage = this.calculateDamage(attacker, defender);
            defender.setHealth(defender.currentHealth - damage);
        }

        return Promise.resolve();
    }

    calculateDamage(attacker, defender) {
        const rawDamage = Math.max(1, attacker.stats.attack - Math.floor(defender.stats.defense / 2));
        return rawDamage;
    }
}

