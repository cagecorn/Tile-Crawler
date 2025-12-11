export class AttributeDamageManager
{
    constructor({
        attributeResourceEngine = null,
        playerAttributeResourceManager = null,
        monsterAttributeResourceManager = null,
        enchantManager = null
    } = {})
    {
        this.attributeResourceEngine = attributeResourceEngine;
        this.playerAttributeResourceManager = playerAttributeResourceManager;
        this.monsterAttributeResourceManager = monsterAttributeResourceManager;
        this.enchantManager = enchantManager;
    }

    calculateDamage({ attacker = null, defender = null, baseDamage = 0, attributeType = null, source = 'generic' } = {})
    {
        const normalizedBase = this.normalizeNumber(baseDamage);
        const providedType = this.normalizeAttributeType(attributeType);
        const weaponEnchant = this.enchantManager?.getWeaponEnchant?.(attacker) ?? null;
        const resolvedType = providedType ?? weaponEnchant;

        if (!resolvedType) {
            return {
                totalDamage: normalizedBase,
                breakdown: {
                    base: normalizedBase,
                    attributeType: null,
                    attributeBonus: 0,
                    weaponBonus: 0,
                    resistance: 0
                }
            };
        }

        const attackResource = this.getResourceTotal(attacker, resolvedType);
        const attributeBonus = attackResource;
        const weaponBonus = providedType && weaponEnchant === providedType ? attackResource : 0;

        const resistanceBase = this.getResourceTotal(defender, resolvedType);
        const armorEnchant = this.enchantManager?.getArmorEnchant?.(defender) ?? null;
        const armorBonus = armorEnchant === resolvedType ? resistanceBase : 0;
        const totalResistance = resistanceBase + armorBonus;

        const totalDamage = Math.max(0, Math.floor(normalizedBase + attributeBonus + weaponBonus - totalResistance));

        return {
            totalDamage,
            breakdown: {
                base: normalizedBase,
                attributeType: resolvedType,
                attributeBonus,
                weaponBonus,
                resistance: totalResistance,
                source
            }
        };
    }

    getResourceTotal(unit, attributeType)
    {
        const manager = this.getResourceManagerForUnit(unit);
        if (!manager?.getTotalAmount || !this.attributeResourceEngine?.isValidType?.(attributeType)) {
            return 0;
        }
        return manager.getTotalAmount(attributeType);
    }

    getResourceManagerForUnit(unit)
    {
        if (!unit) {
            return null;
        }
        if (unit.faction === 'allies') {
            return this.playerAttributeResourceManager;
        }
        return this.monsterAttributeResourceManager;
    }

    normalizeNumber(value = 0)
    {
        const numeric = Number.isFinite(value) ? value : 0;
        return Math.max(0, numeric);
    }

    normalizeAttributeType(attributeType)
    {
        if (!attributeType || !this.attributeResourceEngine?.isValidType?.(attributeType)) {
            return null;
        }
        return attributeType;
    }
}
