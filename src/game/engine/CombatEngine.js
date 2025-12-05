import { ActionOrderEngine } from './ActionOrderEngine.js';

export class CombatEngine {
    constructor({
        turnEngine,
        specialEffectManager,
        particleAnimationEngine,
        textAnimationEngine,
        logEngine
    }) {
        this.turnEngine = turnEngine;
        this.specialEffectManager = specialEffectManager;
        this.particleAnimationEngine = particleAnimationEngine;
        this.textAnimationEngine = textAnimationEngine;
        this.logEngine = logEngine;
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
            this.handleDamageFeedback(attacker, defender, damage);
        }

        return Promise.resolve();
    }

    calculateDamage(attacker, defender) {
        const rawDamage = Math.max(1, attacker.stats.attack - Math.floor(defender.stats.defense / 2));
        return rawDamage;
    }

    handleDamageFeedback(attacker, defender, damage) {
        if (damage <= 0) {
            return;
        }

        this.particleAnimationEngine?.sprayBlood(defender.sprite);
        this.textAnimationEngine?.showDamage(defender.sprite, damage);
        this.logEngine?.log(`${attacker.getName()}가 ${defender.getName()}에게 ${damage}의 피해를 주었습니다.`);
    }
}

