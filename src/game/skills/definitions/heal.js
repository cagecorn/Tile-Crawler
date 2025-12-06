export const healSkill = {
    id: 'heal',
    name: '힐',
    type: 'active',
    icon: 'assets/images/skills/heal.png',
    manaCost: 18,
    cooldown: 3,
    range: { min: 1, max: 5 },
    healingRatio: 1.1,
    description: '사정거리 내 아군 하나를 마법력에 비례하여 치유합니다.',
    aiHint: {
        role: 'support',
        priority: 'sustain'
    },
    selectTarget({ user, allies = [], visionEngine }) {
        const candidates = allies
            .filter((unit) => unit?.isAlive?.())
            .filter((unit) => unit !== user || (unit.currentHealth < unit.maxHealth));

        if (candidates.length === 0) {
            return null;
        }

        candidates.sort((a, b) => {
            const ratioA = a.currentHealth / (a.maxHealth || 1);
            const ratioB = b.currentHealth / (b.maxHealth || 1);
            if (ratioA !== ratioB) {
                return ratioA - ratioB;
            }
            const distanceA = Math.abs(user.tilePosition.x - a.tilePosition.x) + Math.abs(user.tilePosition.y - a.tilePosition.y);
            const distanceB = Math.abs(user.tilePosition.x - b.tilePosition.x) + Math.abs(user.tilePosition.y - b.tilePosition.y);
            return distanceA - distanceB;
        });

        return candidates.find((unit) => {
            const distance = Math.abs(user.tilePosition.x - unit.tilePosition.x) + Math.abs(user.tilePosition.y - unit.tilePosition.y);
            const inRange = distance >= this.range.min && distance <= this.range.max;
            const visible = !visionEngine || visionEngine.canSee(user.tilePosition, unit.tilePosition, user.getSightRange?.());
            return inRange && visible;
        }) ?? null;
    },
    async execute({ user, action, engine, specialEffectManager, textAnimationEngine, logEngine }) {
        const allies = engine?.turnEngine ? Array.from(engine.turnEngine.units ?? []).filter((unit) => unit?.faction === user.faction) : [];
        const target = action?.targetUnit?.isAlive?.() ? action.targetUnit : this.selectTarget({
            user,
            allies,
            visionEngine: engine?.visionEngine
        });

        if (!target) {
            logEngine?.log?.('힐: 대상을 찾지 못했습니다.');
            return false;
        }

        const distance = engine.distance(user.tilePosition, target.tilePosition);
        if (distance < this.range.min || distance > this.range.max) {
            logEngine?.log?.('힐: 사거리 밖입니다.');
            return false;
        }

        const healAmount = Math.max(1, Math.floor((user.stats.magicAttack ?? 0) * this.healingRatio));
        target.setHealth(target.currentHealth + healAmount);
        textAnimationEngine?.showHeal(target.sprite, healAmount);
        specialEffectManager?.refreshUnit?.(target);
        logEngine?.log?.(`${user.getName()}이(가) ${target.getName()}에게 ${healAmount}만큼 힐을 사용했습니다.`);
        return true;
    }
};
