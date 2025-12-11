export class ShieldManager {
    constructor() {
        this.shields = new Map();
    }

    initializeUnit(unit, initialValue = 0) {
        if (!unit) {
            return 0;
        }
        const normalized = this.normalize(initialValue);
        this.shields.set(unit, normalized);
        return normalized;
    }

    addShield(unit, amount = 0) {
        if (!unit) {
            return 0;
        }
        const gained = this.normalize(amount);
        if (gained <= 0) {
            return 0;
        }
        const updated = this.getShield(unit) + gained;
        this.shields.set(unit, updated);
        return gained;
    }

    absorbDamage(unit, amount = 0) {
        if (!unit || amount <= 0) {
            return { remainingDamage: amount, consumed: 0 };
        }
        const current = this.getShield(unit);
        if (current <= 0) {
            return { remainingDamage: amount, consumed: 0 };
        }
        const consumed = Math.min(current, amount);
        this.shields.set(unit, current - consumed);
        return { remainingDamage: amount - consumed, consumed };
    }

    getShield(unit) {
        return this.shields.get(unit) ?? 0;
    }

    clear(unit) {
        this.shields.delete(unit);
    }

    normalize(value = 0) {
        return Math.max(0, Number.isFinite(value) ? value : 0);
    }
}
