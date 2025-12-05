const DEFAULT_SLOTS = ['weapon', 'armor', 'trinket-1', 'trinket-2', 'utility-1', 'utility-2'];

export class EquipmentEngine {
    constructor({ slots = DEFAULT_SLOTS } = {}) {
        this.slots = slots;
        this.equipment = new Map();
    }

    registerUnit(unit) {
        if (!unit || this.equipment.has(unit)) {
            return;
        }
        this.equipment.set(unit, this.createEmptyLoadout());
    }

    unregisterUnit(unit) {
        this.equipment.delete(unit);
    }

    getLoadout(unit) {
        if (!this.equipment.has(unit)) {
            this.registerUnit(unit);
        }
        return this.equipment.get(unit) ?? this.createEmptyLoadout();
    }

    equip(unit, item, preferredSlot = null) {
        if (!unit || !item) {
            return { equipped: null, swapped: null };
        }

        const loadout = this.getLoadout(unit);
        const targetSlot = preferredSlot && this.slots.includes(preferredSlot)
            ? preferredSlot
            : this.getCompatibleSlot(item.slot);
        if (!targetSlot) {
            return { equipped: null, swapped: null };
        }

        const displaced = loadout[targetSlot] ?? null;
        loadout[targetSlot] = item;
        this.applyToUnit(unit);
        return { equipped: item, swapped: displaced, slot: targetSlot };
    }

    unequip(unit, slot) {
        const loadout = this.getLoadout(unit);
        if (!slot || !Object.hasOwn(loadout, slot)) {
            return null;
        }
        const item = loadout[slot];
        loadout[slot] = null;
        this.applyToUnit(unit);
        return item;
    }

    getCompatibleSlot(slotKey) {
        if (this.slots.includes(slotKey)) {
            return slotKey;
        }
        const normalized = this.slots.find((slot) => slot.startsWith(slotKey));
        return normalized ?? null;
    }

    applyToUnit(unit) {
        const loadout = this.getLoadout(unit);
        const modifiers = {};
        Object.values(loadout).forEach((item) => {
            if (!item?.stats) {
                return;
            }
            Object.entries(item.stats).forEach(([key, value]) => {
                modifiers[key] = (modifiers[key] ?? 0) + value;
                if (key === 'health') {
                    modifiers.maxHealth = (modifiers.maxHealth ?? 0) + value;
                }
                if (key === 'mana') {
                    modifiers.maxMana = (modifiers.maxMana ?? 0) + value;
                }
            });
        });

        unit.applyStatModifiers(modifiers);
    }

    createEmptyLoadout() {
        return this.slots.reduce((acc, slot) => ({ ...acc, [slot]: null }), {});
    }
}

export function createEquipmentEngine() {
    return new EquipmentEngine({ slots: DEFAULT_SLOTS });
}
