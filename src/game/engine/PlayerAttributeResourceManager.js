export class PlayerAttributeResourceManager
{
    constructor({ resourceEngine, initialBase = 0 } = {})
    {
        this.resourceEngine = resourceEngine;
        this.resourcePool = resourceEngine?.createEmptyPool?.(initialBase) ?? {};
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

    addBaseResource(type, amount = 1)
    {
        if (!this.resourceEngine?.isValidType?.(type)) {
            return 0;
        }
        const resource = this.ensureResource(type);
        const gained = Math.max(0, Number.isFinite(amount) ? amount : 0);
        if (gained > 0) {
            resource.base += gained;
            this.resourcePool[type] = resource;
        }
        if (gained !== 0) {
            this.emitChange();
        }
        return gained;
    }

    addOvercharge(type, amount = 1)
    {
        if (!this.resourceEngine?.isValidType?.(type)) {
            return 0;
        }
        const resource = this.ensureResource(type);
        const gained = Math.max(0, Number.isFinite(amount) ? amount : 0);
        if (gained > 0) {
            resource.overcharge += gained;
            this.resourcePool[type] = resource;
            this.emitChange();
        }
        return gained;
    }

    decayOverchargeAll(amount = 1)
    {
        let changed = false;
        const decay = Math.max(0, Number.isFinite(amount) ? amount : 0);
        if (decay <= 0) {
            return changed;
        }

        this.resourceEngine?.getResourceTypes()?.forEach((type) => {
            const resource = this.ensureResource(type);
            if (resource.overcharge <= 0) {
                return;
            }
            resource.overcharge = Math.max(0, resource.overcharge - decay);
            this.resourcePool[type] = resource;
            changed = true;
        });

        if (changed) {
            this.emitChange();
        }
        return changed;
    }

    reset()
    {
        this.resourcePool = this.resourceEngine?.createEmptyPool?.(0) ?? {};
        this.emitChange();
    }

    getResources()
    {
        return Object.entries(this.resourcePool ?? {}).reduce((copy, [type, resource]) => {
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

    getTotalAmount(type)
    {
        if (!this.resourceEngine?.isValidType?.(type)) {
            return 0;
        }
        const resource = this.resourcePool?.[type];
        return this.resourceEngine.getTotalAmount(resource);
    }

    getEffectSummary()
    {
        return this.resourceEngine?.applyEffectSummary?.(this.resourcePool) ?? {};
    }

    ensureResource(type)
    {
        if (!this.resourcePool[type]) {
            this.resourcePool[type] = { base: 0, overcharge: 0 };
        }
        return this.resourcePool[type];
    }
}
