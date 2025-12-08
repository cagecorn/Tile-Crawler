export class MonsterAttributeResourceManager
{
    constructor({ resourceEngine, floorProvider = null, initialBase = 0 } = {})
    {
        this.resourceEngine = resourceEngine;
        this.floorProvider = floorProvider;
        this.initialBase = initialBase;
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

    addBaseResource(type, amount = 1, floorId = this.getCurrentFloorId())
    {
        const pool = this.ensureFloorPool(floorId);
        if (!this.resourceEngine?.isValidType?.(type)) {
            return 0;
        }
        const resource = pool[type];
        const gained = Math.max(0, Number.isFinite(amount) ? amount : 0);
        if (gained > 0) {
            resource.base += gained;
        }
        return gained;
    }

    addOvercharge(type, amount = 1, floorId = this.getCurrentFloorId())
    {
        const pool = this.ensureFloorPool(floorId);
        if (!this.resourceEngine?.isValidType?.(type)) {
            return 0;
        }
        const resource = pool[type];
        const gained = Math.max(0, Number.isFinite(amount) ? amount : 0);
        if (gained > 0) {
            resource.overcharge += gained;
        }
        return gained;
    }

    decayOverchargeAll(amount = 1, floorId = this.getCurrentFloorId())
    {
        const pool = this.ensureFloorPool(floorId);
        const decay = Math.max(0, Number.isFinite(amount) ? amount : 0);
        if (decay <= 0) {
            return false;
        }
        let changed = false;
        this.resourceEngine?.getResourceTypes()?.forEach((type) => {
            const resource = pool[type];
            if (resource.overcharge <= 0) {
                return;
            }
            resource.overcharge = Math.max(0, resource.overcharge - decay);
            changed = true;
        });
        return changed;
    }

    applyEffectSummary(floorId = this.getCurrentFloorId())
    {
        return this.resourceEngine?.applyEffectSummary?.(this.ensureFloorPool(floorId)) ?? {};
    }

    ensureFloorPool(floorId)
    {
        if (!this.floorPools.has(floorId)) {
            const baseAmount = Math.max(floorId ?? 0, this.initialBase);
            const pool = this.resourceEngine?.createEmptyPool?.(baseAmount) ?? {};
            this.floorPools.set(floorId, pool);
        }
        return this.floorPools.get(floorId);
    }

    clonePool(pool)
    {
        return Object.entries(pool ?? {}).reduce((copy, [type, resource]) => {
            const base = Math.max(0, resource?.base ?? 0);
            const overcharge = Math.max(0, resource?.overcharge ?? 0);
            copy[type] = {
                base,
                overcharge,
                total: this.resourceEngine?.getTotalAmount?.(resource) ?? base + overcharge
            };
            return copy;
        }, {});
    }

    getTotalAmount(type, floorId = this.getCurrentFloorId())
    {
        if (!this.resourceEngine?.isValidType?.(type)) {
            return 0;
        }
        const pool = this.ensureFloorPool(floorId);
        return this.resourceEngine.getTotalAmount(pool?.[type]);
    }
}
