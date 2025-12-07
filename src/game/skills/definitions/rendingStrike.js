export const rendingStrikeSkill = {
    id: 'rending-strike',
    name: '렌딩 스트라이크',
    type: 'active',
    icon: 'assets/images/skills/rending_strike.png',
    manaCost: 7,
    cooldown: 2,
    range: { min: 1, max: 1 },
    damageMultiplier: 1.1,
    bleedChance: 0.45,
    bleedDuration: 3,
    description: '근접 적에게 참격을 가해 추가 피해를 주고 확률로 출혈을 남깁니다.',
    aiHint: {
        role: 'burst',
        priority: 'sustain'
    },
    async execute({ user, action, engine, combatEngine, specialEffectManager, textAnimationEngine, statusEffectManager, logEngine }) {
        const target = action?.targetUnit?.isAlive?.() ? action.targetUnit : null;
        if (!target) {
            logEngine?.log?.('렌딩 스트라이크: 대상을 선택하세요.');
            return false;
        }

        const distance = engine.distance(user.tilePosition, target.tilePosition);
        if (distance < this.range.min || distance > this.range.max) {
            logEngine?.log?.('렌딩 스트라이크: 사거리 밖입니다.');
            return false;
        }

        const baseDamage = combatEngine?.calculateDamage?.(user, target) ?? 0;
        const damage = Math.max(1, Math.floor(baseDamage * this.damageMultiplier));
        target.setHealth(target.currentHealth - damage);
        textAnimationEngine?.showDamage(target.sprite, damage, { color: '#f7d5d5' });
        combatEngine?.handleDamageFeedback?.(user, target, 0);
        engine.createImpactBurst(target, { color: 0xdb4646, radius: 18, duration: 220 });
        specialEffectManager?.refreshUnit?.(target);

        if (Math.random() < this.bleedChance && statusEffectManager) {
            const bleedPower = Math.max(1, Math.floor((user.stats?.attack ?? 0) * 0.25));
            statusEffectManager.applyStatus({
                unit: target,
                id: 'bleed',
                name: '출혈',
                icon: 'assets/images/status-effects/bleed.png',
                type: 'debuff',
                duration: this.bleedDuration,
                data: { bleedPower },
                onTick: ({ unit, data, manager }) => {
                    const amount = Math.max(1, data?.bleedPower ?? 1);
                    unit.setHealth(unit.currentHealth - amount);
                    textAnimationEngine?.showDamage(unit.sprite, amount, { color: '#b50000' });
                    manager?.specialEffectManager?.refreshUnit?.(unit);
                    logEngine?.log?.(`${unit.getName()}이(가) 출혈로 ${amount} 피해를 받았습니다.`);
                }
            });
        }

        logEngine?.log?.(`${user.getName()}의 렌딩 스트라이크가 ${target.getName()}에게 ${damage} 피해를 입혔습니다.`);
        return true;
    }
};
