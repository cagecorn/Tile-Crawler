import { ATTRIBUTE_DISPLAY_NAMES } from '../engine/AttributeResourceEngine.js';

const DEFAULT_PREFIXES = {
    fire: '불타는',
    water: '서늘한',
    wind: '휘몰아치는',
    earth: '굳건한',
    light: '찬란한',
    dark: '어두운'
};

const DEFAULT_SUFFIXES = {
    fire: '열기',
    water: '심연',
    wind: '질풍',
    earth: '바위심',
    light: '광휘',
    dark: '암영'
};

export class PrefixSuffixManager
{
    constructor({ attributeResourceEngine = null, diceEngine = null, allowedTypes = null } = {})
    {
        this.attributeResourceEngine = attributeResourceEngine;
        this.diceEngine = diceEngine;
        this.allowedTypes = Array.isArray(allowedTypes) && allowedTypes.length > 0
            ? allowedTypes
            : ['fire', 'water', 'wind', 'earth', 'light', 'dark'];
        this.prefixes = { ...DEFAULT_PREFIXES };
        this.suffixes = { ...DEFAULT_SUFFIXES };
    }

    pickEnchantType()
    {
        const validTypes = this.allowedTypes.filter((type) => this.attributeResourceEngine?.isValidType?.(type));
        if (!validTypes.length) {
            return null;
        }
        return this.diceEngine?.pickOne?.(validTypes) ?? validTypes[0];
    }

    applyEnchant(item, attributeType = null)
    {
        if (!item) {
            return item;
        }
        const resolvedType = attributeType ?? this.pickEnchantType();
        if (!resolvedType || !this.attributeResourceEngine?.isValidType?.(resolvedType)) {
            return item;
        }
        const baseName = item.baseName ?? item.name ?? '이름 없는 장비';
        const prefix = this.prefixes[resolvedType] ?? '';
        const suffix = this.suffixes[resolvedType] ?? '';
        const displayName = [prefix, baseName, suffix].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
        const enchantDescriptor = ATTRIBUTE_DISPLAY_NAMES?.[resolvedType] ?? resolvedType;
        const enhancedDescription = `${enchantDescriptor} 속성의 힘이 깃들어 있습니다.`;

        return {
            ...item,
            baseName,
            enchantType: resolvedType,
            name: displayName,
            description: `${enhancedDescription} ${item.description ?? ''}`.trim()
        };
    }
}
