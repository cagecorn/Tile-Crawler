const STAT_LABELS = {
    health: '체력',
    mana: '마력',
    attack: '물리 공격력',
    defense: '물리 방어력',
    magicAttack: '마법 공격력',
    magicDefense: '마법 방어력',
    movePoints: '이동력',
    actionSpeed: '행동 속도',
    sightRange: '시야',
    accuracy: '정확도',
    evasion: '회피',
    critChance: '치명타'
};

function buildItemViewModel(item = {}) {
    const slot = item.slot ? `${item.slot.toUpperCase()} 슬롯` : '장비 아이템';
    const type = item.type ? `${item.type.toUpperCase()} 타입` : '기본형';

    return {
        title: item.name ?? '알 수 없는 아이템',
        subtitle: `${slot} · ${type}`,
        description: item.description || '설명이 없는 장비입니다.',
        stats: item.stats ?? {}
    };
}

function buildMonsterViewModel(monster = {}) {
    const stats = monster.stats ?? {};
    const title = monster.getName?.() ?? monster.name ?? '알 수 없는 몬스터';

    return {
        title,
        subtitle: `${monster.faction ?? '적대 세력'} · 시야 ${stats.sightRange ?? '-'} · 이동력 ${stats.movePoints ?? stats.mobility ?? '-'}`,
        description: monster.description ?? `${title}는 이 구역을 배회하며 침입자를 노립니다.`,
        stats: {
            health: `${monster.currentHealth ?? stats.health ?? 0} / ${monster.maxHealth ?? stats.health ?? 0}`,
            attack: stats.attack,
            defense: stats.defense,
            magicAttack: stats.magicAttack,
            magicDefense: stats.magicDefense,
            movePoints: stats.movePoints ?? stats.mobility,
            actionSpeed: stats.actionSpeed,
            sightRange: stats.sightRange,
            accuracy: stats.accuracy,
            evasion: stats.evasion,
            critChance: stats.critChance
        }
    };
}

export { STAT_LABELS, buildItemViewModel, buildMonsterViewModel };
