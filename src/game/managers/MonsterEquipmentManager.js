export class MonsterEquipmentManager
{
    constructor({
        itemEngine = null,
        equipmentEngine = null,
        enchantManager = null,
        prefixSuffixManager = null,
        diceEngine = null
    } = {})
    {
        this.itemEngine = itemEngine;
        this.equipmentEngine = equipmentEngine;
        this.enchantManager = enchantManager;
        this.prefixSuffixManager = prefixSuffixManager;
        this.diceEngine = diceEngine;
    }

    equipMonster(monster)
    {
        if (!monster || !this.itemEngine || !this.equipmentEngine) {
            return null;
        }

        this.equipmentEngine.registerUnit(monster);
        this.enchantManager?.registerUnit?.(monster);

        const enchantType = this.prefixSuffixManager?.pickEnchantType?.();
        const weapon = this.createEnchantedInstance('short-axe', enchantType);
        const armor = this.createEnchantedInstance('plate-armor', enchantType);

        if (weapon) {
            this.equipmentEngine.equip(monster, weapon, 'weapon');
        }
        if (armor) {
            this.equipmentEngine.equip(monster, armor, 'armor');
        }

        if (enchantType) {
            this.enchantManager?.setWeaponEnchant?.(monster, enchantType);
            this.enchantManager?.setArmorEnchant?.(monster, enchantType);
        }

        return { weapon, armor, enchantType };
    }

    createEnchantedInstance(definitionId, enchantType = null)
    {
        const item = this.itemEngine?.createInstance?.(definitionId) ?? null;
        if (!item) {
            return null;
        }
        if (!this.prefixSuffixManager) {
            return item;
        }
        return this.prefixSuffixManager.applyEnchant(item, enchantType);
    }

    getEquippedItems(monster)
    {
        const loadout = this.equipmentEngine?.getLoadout?.(monster) ?? {};
        return Object.values(loadout).filter(Boolean);
    }

    createDrop(monster)
    {
        const pool = this.getEquippedItems(monster);
        if (!pool.length) {
            return null;
        }
        const selected = this.diceEngine?.pickOne?.(pool) ?? pool[0];
        if (!selected) {
            return null;
        }
        return this.cloneWithNewId(selected);
    }

    cloneWithNewId(item)
    {
        const baseClone = {
            ...item,
            stats: { ...(item.stats ?? {}) }
        };
        const refreshed = this.itemEngine?.createInstance?.(item.definitionId) ?? baseClone;
        const merged = { ...baseClone, instanceId: refreshed.instanceId };
        if (item.enchantType && this.prefixSuffixManager) {
            return this.prefixSuffixManager.applyEnchant(merged, item.enchantType);
        }
        return merged;
    }
}
