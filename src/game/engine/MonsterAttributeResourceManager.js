export class MonsterAttributeResourceManager
{
    constructor({ resourceEngine, floorProvider = null, initialCapacity = 0 } = {})
    {
        this.resourceEngine = resourceEngine;
        this.floorProvider = floorProvider;
        this.initialCapacity = initialCapacity;
        this.floorPools = new Map();
    }

    getCurrentFloorId()
    {
        const provided = typeof this.floorProvider === 'function' ? this.floorProvider() : null;
        if (Number.isFinite(provided)) {
            return provided;
        }
        return 1;
    }

    getResourcesForFloor(floorId = this.getCurrentFloorId())
    {
        return this.clonePool(this.ensureFloorPool(floorId));
    }

    addResource(type, amount = 1, floorId = this.getCurrentFloorId())
    {
        const pool = this.ensureFloorPool(floorId);
        if (!this.resourceEngine?.isValidType?.(type)) {
            return 0;
        }
        const resource = pool[type];
        const newValue = this.resourceEngine.clampValue(type, (resource.current ?? 0) + amount, resource.max);
        const gained = newValue - (resource.current ?? 0);
        resource.current = newValue;
        return gained;
    }

    spendResource(type, amount = 1, floorId = this.getCurrentFloorId())
    {
        const pool = this.ensureFloorPool(floorId);
        if (!this.resourceEngine?.isValidType?.(type)) {
            return 0;
        }
        const resource = pool[type];
        const newValue = this.resourceEngine.clampValue(type, (resource.current ?? 0) - amount, resource.max);
        const spent = (resource.current ?? 0) - newValue;
        resource.current = newValue;
        return spent;
    }

    setCapacityForAll(max, floorId = this.getCurrentFloorId())
    {
        const pool = this.ensureFloorPool(floorId);
        const safeMax = Math.max(0, Number.isFinite(max) ? max : 0);
        this.resourceEngine?.getResourceTypes()?.forEach((type) => {
            pool[type].max = safeMax;
            pool[type].current = Math.min(pool[type].current ?? 0, safeMax);
        });
    }

    applyEffectSummary(floorId = this.getCurrentFloorId())
    {
        return this.resourceEngine?.applyEffectSummary?.(this.ensureFloorPool(floorId)) ?? {};
    }

    ensureFloorPool(floorId)
    {
        if (!this.floorPools.has(floorId)) {
            const pool = this.resourceEngine?.createEmptyPool?.(this.initialCapacity) ?? {};
            this.floorPools.set(floorId, pool);
        }
        return this.floorPools.get(floorId);
    }

    clonePool(pool)
    {
        return Object.entries(pool ?? {}).reduce((copy, [type, resource]) => {
            copy[type] = { ...resource };
            return copy;
        }, {});
    }
}
