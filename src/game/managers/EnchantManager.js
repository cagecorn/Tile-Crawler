export class EnchantManager
{
    constructor({ attributeResourceEngine = null } = {})
    {
        this.attributeResourceEngine = attributeResourceEngine;
        this.enchants = new Map();
    }

    registerUnit(unit)
    {
        if (!unit || this.enchants.has(unit)) {
            return;
        }
        this.enchants.set(unit, { weapon: null, armor: null });
    }

    unregisterUnit(unit)
    {
        this.enchants.delete(unit);
    }

    getWeaponEnchant(unit)
    {
        return this.ensureUnitEntry(unit).weapon;
    }

    getArmorEnchant(unit)
    {
        return this.ensureUnitEntry(unit).armor;
    }

    setWeaponEnchant(unit, attributeType = null)
    {
        const normalized = this.normalizeAttribute(attributeType);
        const entry = this.ensureUnitEntry(unit);
        entry.weapon = normalized;
        return normalized;
    }

    setArmorEnchant(unit, attributeType = null)
    {
        const normalized = this.normalizeAttribute(attributeType);
        const entry = this.ensureUnitEntry(unit);
        entry.armor = normalized;
        return normalized;
    }

    ensureUnitEntry(unit)
    {
        if (!this.enchants.has(unit)) {
            this.registerUnit(unit);
        }
        return this.enchants.get(unit) ?? { weapon: null, armor: null };
    }

    normalizeAttribute(attributeType)
    {
        if (!attributeType) {
            return null;
        }
        if (!this.attributeResourceEngine?.isValidType?.(attributeType)) {
            return null;
        }
        return attributeType;
    }
}
