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

    createEmptyPool(maxPerType = 0)
    {
        return this.resourceTypes.reduce((pool, type) => {
            pool[type] = { current: 0, max: maxPerType };
            return pool;
        }, {});
    }

    applyEffectSummary(resourcePool = {})
    {
        const totals = {};
        this.resourceTypes.forEach((type) => {
            const amount = resourcePool?.[type]?.current ?? 0;
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

    clampValue(type, value, max)
    {
        const safeValue = Number.isFinite(value) ? value : 0;
        if (!this.isValidType(type)) {
            return 0;
        }
        if (!Number.isFinite(max)) {
            return Math.max(0, safeValue);
        }
        return Math.min(Math.max(0, safeValue), Math.max(0, max));
    }
}
