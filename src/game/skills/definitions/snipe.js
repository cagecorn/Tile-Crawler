export const snipeSkill = {
    id: 'snipe',
    name: '저격',
    type: 'active',
    icon: 'assets/images/skills/gunner-attack-icon.png',
    manaCost: 8,
    cooldown: 1,
    range: { min: 1, max: 7 },
    damageMultiplier: 0.75,
    description: '멀리 있는 적을 저격하여 75%의 물리 피해를 입힙니다. 시야 내 적을 선별합니다.',
    aiHint: {
        role: 'poke',
        priority: 'sustain'
    },
    selectTarget({ user, enemies = [], visionEngine }) {
        const candidates = enemies.filter((unit) => unit?.isAlive?.());
        candidates.sort((a, b) => {
            const da = Math.abs(user.tilePosition.x - a.tilePosition.x) + Math.abs(user.tilePosition.y - a.tilePosition.y);
            const db = Math.abs(user.tilePosition.x - b.tilePosition.x) + Math.abs(user.tilePosition.y - b.tilePosition.y);
            return da - db;
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
            logEngine?.log?.('저격: 대상이 없습니다.');
            return false;
        }

        const distance = engine.distance(user.tilePosition, target.tilePosition);
        if (distance < this.range.min || distance > this.range.max) {
            logEngine?.log?.('저격: 사거리 밖입니다.');
            return false;
        }

        const baseDamage = combatEngine?.calculateDamage?.(user, target) ?? 0;
        const damage = Math.max(1, Math.floor(baseDamage * this.damageMultiplier));
        target.setHealth(target.currentHealth - damage);

        textAnimationEngine?.showDamage(target.sprite, damage, { color: '#dcd3ff' });
        combatEngine?.handleDamageFeedback?.(user, target, 0);
        engine.createImpactBurst(target, { color: 0xdcb26b, radius: 18, duration: 240 });
        specialEffectManager?.refreshUnit?.(target);
        logEngine?.log?.(`${user.getName()}의 저격이 ${target.getName()}에게 ${damage} 피해를 입혔습니다.`);

        return true;
    }
};
