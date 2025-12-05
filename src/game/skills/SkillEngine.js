export class SkillEngine {
    constructor({
        movementManager,
        pathfindingEngine,
        turnEngine,
        combatEngine,
        animationEngine,
        specialEffectManager,
        logEngine,
        visionEngine
    } = {}) {
        this.movementManager = movementManager;
        this.pathfindingEngine = pathfindingEngine;
        this.turnEngine = turnEngine;
        this.combatEngine = combatEngine;
        this.animationEngine = animationEngine;
        this.specialEffectManager = specialEffectManager;
        this.logEngine = logEngine;
        this.visionEngine = visionEngine;

        this.skills = new Map();
        this.unitSkills = new WeakMap();
        this.cooldowns = new WeakMap();

        this.turnEngine?.setActionResolver?.(this);
    }

    registerSkill(skill) {
        if (!skill?.id) {
            return;
        }
        this.skills.set(skill.id, skill);
    }

    getSkill(skillId) {
        return this.skills.get(skillId) ?? null;
    }

    getActiveSkills() {
        return Array.from(this.skills.values()).filter((skill) => skill.type === 'active');
    }

    getPassiveSkills() {
        return Array.from(this.skills.values()).filter((skill) => skill.type === 'passive');
    }

    grantSkillToUnit(unit, skillId) {
        if (!unit || !this.skills.has(skillId)) {
            return false;
        }

        const current = this.unitSkills.get(unit) ?? { active: new Set(), passive: new Set() };
        const skill = this.skills.get(skillId);
        const bucket = skill.type === 'passive' ? current.passive : current.active;
        bucket.add(skillId);
        this.unitSkills.set(unit, current);
        return true;
    }

    getUnitSkills(unit, type = 'active') {
        const entry = this.unitSkills.get(unit);
        if (!entry) {
            return [];
        }
        const bucket = type === 'passive' ? entry.passive : entry.active;
        return Array.from(bucket);
    }

    hasSkill(unit, skillId) {
        const entry = this.unitSkills.get(unit);
        if (!entry) {
            return false;
        }
        return entry.active.has(skillId) || entry.passive.has(skillId);
    }

    canUseSkill(unit, skillId) {
        const skill = this.skills.get(skillId);
        if (!unit || !skill || !this.hasSkill(unit, skillId)) {
            return false;
        }
        if (skill.manaCost && unit.currentMana < skill.manaCost) {
            return false;
        }
        const remainingCooldown = this.getRemainingCooldown(unit, skillId);
        return remainingCooldown <= 0;
    }

    getRemainingCooldown(unit, skillId) {
        const cooldownEntry = this.cooldowns.get(unit);
        const currentTurn = this.turnEngine?.turnCount ?? 0;
        const readyTurn = cooldownEntry?.get(skillId) ?? 0;
        return Math.max(0, readyTurn - currentTurn);
    }

    resolve(unit, action) {
        if (action?.type !== 'skill') {
            return null;
        }

        const skill = this.skills.get(action.skillId);
        if (!skill || !this.canUseSkill(unit, skill.id)) {
            return Promise.resolve(false);
        }

        return this.executeSkill(skill, unit, action);
    }

    async executeSkill(skill, unit, action) {
        const context = {
            user: unit,
            action,
            engine: this,
            pathfindingEngine: this.pathfindingEngine,
            combatEngine: this.combatEngine,
            animationEngine: this.animationEngine,
            specialEffectManager: this.specialEffectManager,
            visionEngine: this.visionEngine,
            logEngine: this.logEngine,
            turnEngine: this.turnEngine
        };

        const success = await skill.execute?.(context);
        if (success) {
            this.commitSkillCost(unit, skill);
        }
        return success;
    }

    commitSkillCost(unit, skill) {
        const currentTurn = this.turnEngine?.turnCount ?? 0;
        if (skill.cooldown) {
            const entry = this.cooldowns.get(unit) ?? new Map();
            entry.set(skill.id, currentTurn + skill.cooldown);
            this.cooldowns.set(unit, entry);
        }
        if (skill.manaCost) {
            unit.setMana(unit.currentMana - skill.manaCost);
        }
    }

    findHostileUnits(user) {
        if (!this.turnEngine || !user) {
            return [];
        }
        return Array.from(this.turnEngine.units ?? []).filter((unit) => unit?.isAlive?.() && unit.faction !== user.faction);
    }

    distance(a, b) {
        if (!a || !b) {
            return Number.POSITIVE_INFINITY;
        }
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    findAdjacentLanding(user, target) {
        const neighbors = [
            { x: target.tilePosition.x + 1, y: target.tilePosition.y },
            { x: target.tilePosition.x - 1, y: target.tilePosition.y },
            { x: target.tilePosition.x, y: target.tilePosition.y + 1 },
            { x: target.tilePosition.x, y: target.tilePosition.y - 1 }
        ];

        const openTiles = neighbors.filter((tile) => {
            const occupant = this.turnEngine?.getUnitAt(tile);
            return (!occupant || occupant === user) && this.pathfindingEngine?.inBounds?.(tile);
        });

        openTiles.sort((a, b) => this.distance(user.tilePosition, a) - this.distance(user.tilePosition, b));
        return openTiles[0] ?? null;
    }

    toDeltas(path = []) {
        const deltas = [];
        for (let i = 1; i < path.length; i++) {
            const prev = path[i - 1];
            const curr = path[i];
            deltas.push({ dx: curr.x - prev.x, dy: curr.y - prev.y });
        }
        return deltas;
    }

    createAfterimageTrail(unit, tiles = []) {
        if (!unit?.scene || !unit?.sprite) {
            return;
        }
        const trailTiles = tiles.slice(1);
        trailTiles.forEach((tile, index) => {
            const world = this.animationEngine?.tileToWorldPosition(tile, unit.tileSize);
            const ghost = unit.scene.add.image(world?.x ?? unit.sprite.x, world?.y ?? unit.sprite.y, unit.sprite.texture.key);
            ghost.setAlpha(0.4);
            ghost.setDepth((unit.sprite.depth ?? 10) - 1);
            ghost.setTint(0xbad4ff);

            unit.scene.tweens.add({
                targets: ghost,
                alpha: 0,
                duration: 240 + index * 30,
                ease: 'Cubic.easeOut',
                onComplete: () => ghost.destroy()
            });
        });
    }
}
