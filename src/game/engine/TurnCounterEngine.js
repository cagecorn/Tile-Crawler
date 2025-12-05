export class TurnCounterEngine {
    constructor() {
        this.turn = 0;
        this.unitCounters = new Map();
        this.globalCounters = new Map();
        this.listeners = new Set();
    }

    onTick(listener) {
        if (listener) {
            this.listeners.add(listener);
        }
    }

    advanceTurn({ units = [] } = {}) {
        this.turn += 1;
        this.tickUnitCounters(units);
        this.tickGlobalCounters();
    }

    setCounter({ unit = null, category = 'general', key, duration, data = null }) {
        if (!key || duration <= 0) {
            return;
        }

        const targetMap = unit ? this.getOrCreateUnitBucket(unit) : this.getOrCreateGlobalBucket();
        const categoryMap = targetMap.get(category) ?? new Map();
        categoryMap.set(key, { remaining: duration, data });
        targetMap.set(category, categoryMap);
    }

    clearCounter({ unit = null, category = 'general', key }) {
        const targetMap = unit ? this.unitCounters.get(unit) : this.globalCounters;
        const categoryMap = targetMap?.get(category);
        if (categoryMap) {
            categoryMap.delete(key);
            if (categoryMap.size === 0) {
                targetMap.delete(category);
            }
        }
    }

    getRemaining({ unit = null, category = 'general', key }) {
        const targetMap = unit ? this.unitCounters.get(unit) : this.globalCounters;
        const categoryMap = targetMap?.get(category);
        const entry = categoryMap?.get(key);
        return entry ? entry.remaining : 0;
    }

    tickUnitCounters(units = []) {
        const aliveUnits = new Set(units);
        this.unitCounters.forEach((categoryMap, unit) => {
            if (!aliveUnits.has(unit)) {
                this.unitCounters.delete(unit);
                return;
            }
            this.reduceCategoryMap(categoryMap, unit);
        });
    }

    tickGlobalCounters() {
        this.reduceCategoryMap(this.globalCounters, null);
    }

    reduceCategoryMap(categoryMap, unit) {
        const expired = [];

        for (const [category, entries] of categoryMap.entries()) {
            for (const [key, entry] of entries.entries()) {
                entry.remaining -= 1;
                if (entry.remaining <= 0) {
                    expired.push({ category, key, data: entry.data, unit });
                    entries.delete(key);
                }
            }
            if (entries.size === 0) {
                categoryMap.delete(category);
            }
        }

        expired.forEach((payload) => this.notifyExpiry(payload));
    }

    notifyExpiry(payload) {
        this.listeners.forEach((listener) => listener(payload));
    }

    getOrCreateUnitBucket(unit) {
        if (!this.unitCounters.has(unit)) {
            this.unitCounters.set(unit, new Map());
        }
        return this.unitCounters.get(unit);
    }

    getOrCreateGlobalBucket() {
        if (!this.globalCounters) {
            this.globalCounters = new Map();
        }
        return this.globalCounters;
    }
}
