export class ItemEngine {
    constructor() {
        this.counter = 0;
        this.documents = {
            weapons: new Map(),
            armors: new Map()
        };
    }

    registerItem(definition) {
        if (!definition?.id) {
            return;
        }
        const collection = definition.type === 'armor' ? this.documents.armors : this.documents.weapons;
        collection.set(definition.id, definition);
    }

    createInstance(id, extraData = {}) {
        const definition = this.getItemDefinition(id);
        if (!definition) {
            return null;
        }

        return {
            instanceId: this.generateId(),
            definitionId: definition.id,
            name: definition.name,
            slot: definition.slot,
            type: definition.type,
            icon: definition.icon,
            stats: definition.stats ?? {},
            description: definition.description ?? '',
            ...extraData
        };
    }

    generateId() {
        this.counter += 1;
        return `${Date.now().toString(16)}-${this.counter}`;
    }

    getItemDefinition(id) {
        return this.documents.weapons.get(id) || this.documents.armors.get(id) || null;
    }

    getDocuments() {
        return {
            weapons: Array.from(this.documents.weapons.values()),
            armors: Array.from(this.documents.armors.values())
        };
    }
}

export function createDefaultItemEngine() {
    const engine = new ItemEngine();

    engine.registerItem({
        id: 'short-axe',
        name: '숏액스',
        type: 'weapon',
        slot: 'weapon',
        icon: 'assets/images/item/weapon/short-axe.png',
        description: '기본 전투용 도끼. 가볍고 빠르다.',
        stats: {
            attack: 6,
            critChance: 2
        }
    });

    engine.registerItem({
        id: 'plate-armor',
        name: '판금 갑옷',
        type: 'armor',
        slot: 'armor',
        icon: 'assets/images/item/armor/plate-armor.png',
        description: '튼튼한 판금 갑옷. 무겁지만 확실한 방어력을 제공한다.',
        stats: {
            defense: 10,
            magicDefense: 4,
            movePoints: -1
        }
    });

    engine.registerItem({
        id: 'mysterious-book',
        name: '신비한 책',
        type: 'book',
        slot: 'none',
        icon: 'assets/images/item/misc/book.png', // Placeholder
        description: '작가의 영혼이 담긴 책. 읽으면 새로운 세계가 열린다.',
        stats: {}
    });

    return engine;
}
