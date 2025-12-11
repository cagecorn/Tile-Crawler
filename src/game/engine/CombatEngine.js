import { ActionOrderEngine } from './ActionOrderEngine.js';

export class CombatEngine {
    constructor({
        turnEngine,
        specialEffectManager,
        particleAnimationEngine,
        textAnimationEngine,
        logEngine,
        attributeDamageManager = null
    }) {
        this.turnEngine = turnEngine;
        this.specialEffectManager = specialEffectManager;
        this.particleAnimationEngine = particleAnimationEngine;
        this.textAnimationEngine = textAnimationEngine;
        this.logEngine = logEngine;
        this.attributeDamageManager = attributeDamageManager;
        this.actionOrderEngine = new ActionOrderEngine();
    }

    async resolveEngagement(unitA, unitB) {
        const attackers = this.actionOrderEngine.orderUnits([unitA, unitB]);
        const distance = this.distance(unitA.tilePosition, unitB.tilePosition);

        for (const attacker of attackers) {
            const defender = attacker === unitA ? unitB : unitA;
            if (!attacker.isAlive() || !defender.isAlive()) {
                continue;
            }
            if (!this.canAttack(attacker, defender, distance)) {
                continue;
            }
            const damage = this.calculateDamage(attacker, defender);
            defender.setHealth(defender.currentHealth - damage);
            this.handleDamageFeedback(attacker, defender, damage);
        }

        return Promise.resolve();
    }

    calculateDamage(attacker, defender, { attributeType = null, source = 'attack' } = {}) {
        const rawDamage = Math.max(1, attacker.stats.attack - Math.floor(defender.stats.defense / 2));
        const attributeResult = this.attributeDamageManager?.calculateDamage?.({
            attacker,
            defender,
            baseDamage: rawDamage,
            attributeType,
            source
        });

        return attributeResult?.totalDamage ?? rawDamage;
    }

    handleDamageFeedback(attacker, defender, damage) {
        if (damage <= 0) {
            return;
        }

        this.particleAnimationEngine?.sprayBlood(defender.sprite);
        this.textAnimationEngine?.showDamage(defender.sprite, damage);
        this.logEngine?.log(`${attacker.getName()}가 ${defender.getName()}에게 ${damage}의 피해를 주었습니다.`);
    }

    canAttack(attacker, defender, distance) {
        if (!attacker || !defender) {
            return false;
        }

        const range = attacker.getAttackRange?.() ?? 0;
        return range > 0 && distance <= range;
    }

    distance(a, b) {
        if (!a || !b) {
            return Number.POSITIVE_INFINITY;
        }
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }
}

