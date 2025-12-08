export const ATTRIBUTE_RESOURCE_TYPES = [
    'fire',
    'water',
    'wind',
    'earth',
    'light',
    'dark',
    'iron',
    'blood',
    'poison'
];

export const ATTRIBUTE_DISPLAY_NAMES = {
    fire: '불',
    water: '물',
    wind: '바람',
    earth: '땅',
    light: '빛',
    dark: '어둠',
    iron: '철',
    blood: '피',
    poison: '독'
};

const DEFAULT_EFFECT_BUILDERS = {
    fire: (amount) => ({ burnPower: amount, morale: amount * 0.1 }),
    water: (amount) => ({ healingBoost: amount * 0.05 }),
    wind: (amount) => ({ actionSpeedBoost: amount * 0.5 }),
    earth: (amount) => ({ guardBonus: amount }),
    light: (amount) => ({ clarity: amount * 0.25 }),
    dark: (amount) => ({ lifeSteal: amount * 0.02 }),
    iron: (amount) => ({ shieldBonus: amount * 2 }),
    blood: (amount) => ({ regenBonus: amount * 0.5 }),
    poison: (amount) => ({ venomPower: amount })
};

export class AttributeResourceEngine
{
    constructor({ resourceTypes = ATTRIBUTE_RESOURCE_TYPES, effectBuilders = DEFAULT_EFFECT_BUILDERS } = {})
    {
        this.resourceTypes = resourceTypes;
        this.effectBuilders = effectBuilders;
    }

    getResourceTypes()
    {
        return this.resourceTypes.slice();
    }

    isValidType(type)
    {
        return this.resourceTypes.includes(type);
    }

    createEmptyPool(basePerType = 0)
    {
        const baseAmount = Math.max(0, Number.isFinite(basePerType) ? basePerType : 0);
        return this.resourceTypes.reduce((pool, type) => {
            pool[type] = { base: baseAmount, overcharge: 0 };
            return pool;
        }, {});
    }

    applyEffectSummary(resourcePool = {})
    {
        const totals = {};
        this.resourceTypes.forEach((type) => {
            const amount = this.getTotalAmount(resourcePool?.[type]);
            if (amount <= 0) {
                return;
            }
            const effectBuilder = this.effectBuilders[type];
            if (typeof effectBuilder !== 'function') {
                return;
            }
            const effects = effectBuilder(amount) ?? {};
            Object.entries(effects).forEach(([key, value]) => {
                totals[key] = (totals[key] ?? 0) + value;
            });
        });
        return totals;
    }

    getTotalAmount(resource = {})
    {
        const base = Math.max(0, resource?.base ?? 0);
        const overcharge = Math.max(0, resource?.overcharge ?? 0);
        return base + overcharge;
    }

    pickRandomType()
    {
        if (!Array.isArray(this.resourceTypes) || this.resourceTypes.length === 0) {
            return null;
        }
        const index = Math.floor(Math.random() * this.resourceTypes.length);
        return this.resourceTypes[index];
    }
}
