export class RegenManager {
    constructor({ turnCounterEngine, specialEffectManager = null, unitProvider = null, logEngine = null } = {}) {
        this.turnCounterEngine = turnCounterEngine;
        this.specialEffectManager = specialEffectManager;
        this.unitProvider = unitProvider;
        this.logEngine = logEngine;

        this.handleTick = this.handleTick.bind(this);
        this.turnCounterEngine?.onTick?.(this.handleTick);
    }

    handleTick(payload = {}) {
        const isTickPayload = Object.prototype.hasOwnProperty.call(payload, 'units');
        if (!isTickPayload) {
            return;
        }

        const providedUnits = typeof this.unitProvider === 'function' ? this.unitProvider() : payload.units;
        this.applyRegen(providedUnits ?? []);
    }

    applyRegen(units = []) {
        for (const unit of units) {
            if (!unit?.isAlive?.()) {
                continue;
            }
            this.applyHealthRegen(unit);
            this.applyManaRegen(unit);
        }
    }

    applyHealthRegen(unit) {
        const healthRegen = unit.stats?.healthRegen ?? 0;
        if (healthRegen <= 0 || unit.currentHealth >= unit.maxHealth) {
            return;
        }

        const before = unit.currentHealth;
        unit.setHealth(unit.currentHealth + healthRegen);
        const restored = unit.currentHealth - before;
        if (restored > 0) {
            this.specialEffectManager?.refreshUnit?.(unit);
        }
    }

    applyManaRegen(unit) {
        const manaRegen = unit.stats?.manaRegen ?? 0;
        if (manaRegen <= 0 || unit.currentMana >= unit.maxMana) {
            return;
        }

        const before = unit.currentMana;
        unit.setMana(unit.currentMana + manaRegen);
        const restored = unit.currentMana - before;
        if (restored > 0) {
            this.specialEffectManager?.refreshUnit?.(unit);
        }
    }
}
