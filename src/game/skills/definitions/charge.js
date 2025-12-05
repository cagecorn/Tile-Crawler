export const chargeSkill = {
    id: 'charge',
    name: '차지',
    type: 'active',
    icon: 'assets/images/skills/charge.png',
    manaCost: 10,
    cooldown: 3,
    range: { min: 4, max: 6 },
    damageMultiplier: 1.35,
    description: '4~6타일 밖의 적에게 잔상을 남기며 돌진, 135% 물리 피해와 강한 충돌 효과를 가한다.',
    aiHint: {
        role: 'gapclose',
        priority: 'burst'
    },
    selectTarget({ user, enemies = [], visionEngine }) {
        const candidates = enemies.filter((unit) => unit?.isAlive?.());
        candidates.sort((a, b) => {
            const da = Math.abs(user.tilePosition.x - a.tilePosition.x) + Math.abs(user.tilePosition.y - a.tilePosition.y);
            const db = Math.abs(user.tilePosition.x - b.tilePosition.x) + Math.abs(user.tilePosition.y - b.tilePosition.y);
            return da - db;
        });

        return candidates.find((unit) => {
            const distance = Math.abs(user.tilePosition.x - unit.tilePosition.x) + Math.abs(user.tilePosition.y - unit.tilePosition.y);
            const inRange = distance >= this.range.min && distance <= this.range.max;
            const visible = !visionEngine || visionEngine.canSee(user.tilePosition, unit.tilePosition, user.getSightRange?.());
            return inRange && visible;
        }) ?? null;
    },
    async execute({ user, action, engine, pathfindingEngine, combatEngine, specialEffectManager, logEngine }) {
        const enemies = engine.findHostileUnits(user);
        const target = action?.targetUnit?.isAlive?.() ? action.targetUnit : this.selectTarget({
            user,
            enemies,
            visionEngine: engine.visionEngine
        });

        if (!target) {
            logEngine?.log?.('차지: 대상이 없습니다.');
            return false;
        }

        const distance = engine.distance(user.tilePosition, target.tilePosition);
        if (distance < this.range.min || distance > this.range.max) {
            logEngine?.log?.('차지: 사거리 밖입니다.');
            return false;
        }

        const landingTile = engine.findAdjacentLanding(user, target);
        if (!landingTile) {
            logEngine?.log?.('차지: 도달할 위치를 찾지 못했습니다.');
            return false;
        }

        const path = pathfindingEngine?.findPath(user.tilePosition, landingTile) ?? [];
        if (path.length <= 1) {
            logEngine?.log?.('차지: 경로가 없습니다.');
            return false;
        }

        const deltas = engine.toDeltas(path);
        const traversed = await user.attemptPath(deltas);
        if (traversed <= 0) {
            return false;
        }

        const traveledPath = path.slice(0, traversed + 1);
        engine.createAfterimageTrail(user, traveledPath);

        const baseDamage = combatEngine?.calculateDamage?.(user, target) ?? 0;
        const damage = Math.max(1, Math.floor(baseDamage * this.damageMultiplier));
        target.setHealth(target.currentHealth - damage);
        engine.createImpactBurst(target, { color: 0xfff0b8, radius: 24, duration: 280 });
        combatEngine?.handleDamageFeedback?.(user, target, damage);
        specialEffectManager?.refreshUnit?.(target);
        logEngine?.log?.(`${user.getName()}의 차지가 ${target.getName()}에게 ${damage} 피해를 입혔습니다.`);

        return true;
    }
};
