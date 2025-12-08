export class PlayerAttributeResourceManager
{
    constructor({ resourceEngine, initialCapacity = 0 } = {})
    {
        this.resourceEngine = resourceEngine;
        this.resourcePool = resourceEngine?.createEmptyPool?.(initialCapacity) ?? {};
        this.listeners = new Set();
    }

    onChange(callback)
    {
        if (typeof callback !== 'function') {
            return () => {};
        }
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    emitChange()
    {
        const snapshot = this.getResources();
        this.listeners.forEach((listener) => listener(snapshot));
    }

    setCapacityForAll(max)
    {
        this.resourceEngine?.getResourceTypes()?.forEach((type) => {
            this.setCapacity(type, max);
        });
        this.emitChange();
    }

    setCapacity(type, max)
    {
        if (!this.resourceEngine?.isValidType?.(type)) {
            return;
        }
        const safeMax = Math.max(0, Number.isFinite(max) ? max : 0);
        const resource = this.resourcePool[type] ?? { current: 0, max: safeMax };
        resource.max = safeMax;
        resource.current = Math.min(resource.current ?? 0, resource.max);
        this.resourcePool[type] = resource;
    }

    addResource(type, amount = 1)
    {
        if (!this.resourceEngine?.isValidType?.(type)) {
            return 0;
        }
        const resource = this.resourcePool[type] ?? { current: 0, max: 0 };
        const newValue = this.resourceEngine.clampValue(type, (resource.current ?? 0) + amount, resource.max);
        const gained = newValue - (resource.current ?? 0);
        resource.current = newValue;
        this.resourcePool[type] = resource;
        if (gained !== 0) {
            this.emitChange();
        }
        return gained;
    }

    spendResource(type, amount = 1)
    {
        if (!this.resourceEngine?.isValidType?.(type)) {
            return 0;
        }
        const resource = this.resourcePool[type] ?? { current: 0, max: 0 };
        const newValue = this.resourceEngine.clampValue(type, (resource.current ?? 0) - amount, resource.max);
        const spent = (resource.current ?? 0) - newValue;
        resource.current = newValue;
        this.resourcePool[type] = resource;
        if (spent !== 0) {
            this.emitChange();
        }
        return spent;
    }

    reset()
    {
        const maxPerType = {};
        this.resourceEngine?.getResourceTypes()?.forEach((type) => {
            maxPerType[type] = this.resourcePool?.[type]?.max ?? 0;
        });
        this.resourcePool = this.resourceEngine?.createEmptyPool?.(0) ?? {};
        Object.entries(maxPerType).forEach(([type, max]) => this.setCapacity(type, max));
        this.emitChange();
    }

    getResources()
    {
        return Object.entries(this.resourcePool ?? {}).reduce((copy, [type, resource]) => {
            copy[type] = { ...resource };
            return copy;
        }, {});
    }

    getEffectSummary()
    {
        return this.resourceEngine?.applyEffectSummary?.(this.resourcePool) ?? {};
    }
}
