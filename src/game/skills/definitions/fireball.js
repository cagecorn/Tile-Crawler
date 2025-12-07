export const fireballSkill = {
    id: 'fireball',
    name: '파이어볼',
    type: 'active',
    icon: 'assets/images/skills/fire-ball.png',
    manaCost: 12,
    cooldown: 2,
    range: { min: 2, max: 6 },
    damageMultiplier: 1.35,
    description: '원거리의 적 하나에게 마법 + 화염 피해를 가합니다.',
    aiHint: {
        role: 'burst',
        priority: 'sustain'
    },
    selectTarget({ user, enemies = [], visionEngine }) {
        const candidates = enemies.filter((unit) => unit?.isAlive?.());
        candidates.sort((a, b) => {
            const da = Math.abs(user.tilePosition.x - a.tilePosition.x) + Math.abs(user.tilePosition.y - a.tilePosition.y);
            const db = Math.abs(user.tilePosition.x - b.tilePosition.x) + Math.abs(user.tilePosition.y - b.tilePosition.y);
            return db - da;
        });

        return (
            candidates.find((unit) => {
                const distance = Math.abs(user.tilePosition.x - unit.tilePosition.x) + Math.abs(user.tilePosition.y - unit.tilePosition.y);
                const inRange = distance >= this.range.min && distance <= this.range.max;
                const visible = !visionEngine || visionEngine.canSee(user.tilePosition, unit.tilePosition, user.getSightRange?.());
                return inRange && visible;
            }) ?? null
        );
    },
    async execute({ user, action, engine, combatEngine, specialEffectManager, textAnimationEngine, logEngine }) {
        const enemies = engine.findHostileUnits(user);
        const target = action?.targetUnit?.isAlive?.()
            ? action.targetUnit
            : this.selectTarget({ user, enemies, visionEngine: engine.visionEngine });

        if (!target) {
            logEngine?.log?.('파이어볼: 대상이 없습니다.');
            return false;
        }

        const distance = engine.distance(user.tilePosition, target.tilePosition);
        if (distance < this.range.min || distance > this.range.max) {
            logEngine?.log?.('파이어볼: 사거리 밖입니다.');
            return false;
        }

        const magicAttack = user.stats?.magicAttack ?? user.stats?.attack ?? 0;
        const magicDefense = target.stats?.magicDefense ?? target.stats?.defense ?? 0;
        const baseDamage = Math.max(1, magicAttack - Math.floor(magicDefense / 3));
        const damage = Math.max(1, Math.floor(baseDamage * this.damageMultiplier));

        target.setHealth(target.currentHealth - damage);
        textAnimationEngine?.showDamage(target.sprite, damage, { color: '#ffb347' });
        combatEngine?.handleDamageFeedback?.(user, target, 0);
        engine.createImpactBurst(target, { color: 0xff6b3b, radius: 22, duration: 260 });
        specialEffectManager?.refreshUnit?.(target);
        logEngine?.log?.(`${user.getName()}의 파이어볼이 ${target.getName()}에게 ${damage}의 화염 피해를 입혔습니다.`);
        return true;
    }
};
