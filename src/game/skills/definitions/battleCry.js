export const battleCrySkill = {
    id: 'battle-cry',
    name: '배틀 크라이',
    type: 'active',
    icon: 'assets/images/skills/battle_cry.png',
    manaCost: 14,
    cooldown: 5,
    range: { min: 0, max: 3 },
    duration: 3,
    description: '주위 3타일 내 아군의 물리 공격력을 일시적으로 끌어올립니다.',
    aiHint: {
        role: 'support',
        priority: 'burst'
    },
    async execute({ user, engine, logEngine, statusEffectManager }) {
        const allies = engine.findAlliedUnits(user);
        const targets = allies.filter((unit) => engine.distance(user.tilePosition, unit.tilePosition) <= this.range.max);
        if (targets.length === 0) {
            logEngine?.log?.('배틀 크라이: 범위 내 아군이 없습니다.');
            return false;
        }

        const attackBoost = Math.max(2, Math.floor((user.stats?.attack ?? 0) * 0.35));
        targets.forEach((unit) => {
            if (statusEffectManager) {
                statusEffectManager.applyStatus({
                    unit,
                    id: `battle-cry-${user.faction}`,
                    name: '배틀 크라이',
                    icon: this.icon,
                    type: 'buff',
                    duration: this.duration,
                    modifiers: { attack: attackBoost }
                });
            } else {
                unit.applyStatModifiers({ attack: attackBoost });
            }
        });

        logEngine?.log?.(`${user.getName()}이(가) 포효하여 아군의 사기를 높였습니다. (공격력 +${attackBoost})`);
        return true;
    }
};
