import { TileType } from '../../dungeon/DungeonGenerator.js';

export class MonsterBehaviorTree {
    constructor(pathfindingEngine, visionEngine, turnEngine, skillEngine) {
        this.pathfindingEngine = pathfindingEngine;
        this.visionEngine = visionEngine;
        this.turnEngine = turnEngine;
        this.skillEngine = skillEngine;
    }

    decide(monster, player) {
        if (!monster?.isAlive?.()) {
            return null;
        }

        const hostiles = this.skillEngine?.findHostileUnits(monster) ?? [];
        const visibleHostiles = hostiles.filter((unit) => this.canSee(monster, unit));
        const primaryTarget = visibleHostiles[0] ?? hostiles[0] ?? player;

        if (!primaryTarget) {
            return null;
        }

        const profile = monster.behaviorProfile ?? 'shambler';
        if (profile === 'shambler') {
            return this.decideForShambler(monster, primaryTarget, visibleHostiles.length > 0);
        }
        if (profile === 'melee') {
            return this.decideForMelee(monster, visibleHostiles, primaryTarget);
        }
        if (profile === 'skirmisher') {
            return this.decideForSkirmisher(monster, visibleHostiles, primaryTarget);
        }
        if (profile === 'caster') {
            return this.decideForCaster(monster, visibleHostiles, primaryTarget);
        }
        if (profile === 'warden') {
            return this.decideForWarden(monster, visibleHostiles, primaryTarget);
        }

        return this.approach(monster, primaryTarget.tilePosition);
    }

    decideForShambler(monster, primaryTarget, seesEnemy) {
        if (!monster.isAwake?.() && !seesEnemy) {
            return null;
        }
        if (seesEnemy) {
            monster.awaken?.();
        }

        if (seesEnemy) {
            return this.approach(monster, primaryTarget.tilePosition);
        }
        return this.wander(monster);
    }

    decideForMelee(monster, visibleHostiles, primaryTarget) {
        if (visibleHostiles.length > 0) {
            const strike = this.trySkill(monster, 'rending-strike', visibleHostiles);
            if (strike) {
                return strike;
            }
            return this.approach(monster, primaryTarget.tilePosition);
        }
        return this.wander(monster);
    }

    decideForSkirmisher(monster, visibleHostiles, primaryTarget) {
        if (visibleHostiles.length > 0) {
            const snipe = this.trySkill(monster, 'snipe', visibleHostiles);
            if (snipe) {
                return snipe;
            }

            const distance = this.distance(monster.tilePosition, primaryTarget.tilePosition);
            const preferredRange = { min: 3, max: monster.getAttackRange?.() ?? 6 };
            if (distance < preferredRange.min) {
                const retreat = this.findRetreat(monster, primaryTarget);
                if (retreat) {
                    return this.approach(monster, retreat);
                }
            }
            if (distance > preferredRange.max) {
                return this.approach(monster, primaryTarget.tilePosition);
            }
            return null;
        }
        return this.wander(monster);
    }

    decideForCaster(monster, visibleHostiles, primaryTarget) {
        if (visibleHostiles.length > 0) {
            const fireball = this.trySkill(monster, 'fireball', visibleHostiles);
            if (fireball) {
                return fireball;
            }
            return this.approach(monster, primaryTarget.tilePosition);
        }
        return this.wander(monster);
    }

    decideForWarden(monster, visibleHostiles, primaryTarget) {
        if (visibleHostiles.length > 0) {
            if (this.skillEngine?.canUseSkill(monster, 'battle-cry')) {
                return { type: 'skill', skillId: 'battle-cry' };
            }
            return this.approach(monster, primaryTarget.tilePosition);
        }
        return this.wander(monster);
    }

    trySkill(monster, skillId, visibleHostiles = []) {
        if (!this.skillEngine?.canUseSkill(monster, skillId)) {
            return null;
        }
        const skill = this.skillEngine.getSkill(skillId);
        const targetUnit = skill?.selectTarget?.({
            user: monster,
            enemies: visibleHostiles,
            visionEngine: this.visionEngine
        }) ?? visibleHostiles[0];

        if (!targetUnit) {
            return null;
        }

        const distance = this.distance(monster.tilePosition, targetUnit.tilePosition);
        const minRange = skill?.range?.min ?? 1;
        const maxRange = skill?.range?.max ?? 1;
        if (distance < minRange || distance > maxRange) {
            return null;
        }

        return { type: 'skill', skillId, targetUnit };
    }

    approach(monster, targetTile) {
        const path = this.pathfindingEngine?.findPath(monster.tilePosition, targetTile) ?? [];
        if (path.length <= 1) {
            return null;
        }

        const deltas = [];
        for (let i = 1; i < path.length && deltas.length < (monster.stats?.movePoints ?? monster.stats?.mobility ?? 1); i++) {
            const prev = path[i - 1];
            const curr = path[i];
            deltas.push({ x: curr.x - prev.x, y: curr.y - prev.y });
        }
        return { type: 'move', path: deltas };
    }

    wander(monster) {
        const driftRadius = 4;
        const candidateTiles = this.shuffledNeighbors(monster.tilePosition)
            .filter((tile) => this.withinAnchor(tile, monster.spawnAnchor, driftRadius))
            .filter((tile) => this.isWalkable(tile));

        if (candidateTiles.length === 0) {
            return null;
        }

        return this.approach(monster, candidateTiles[0]);
    }

    findRetreat(monster, threat) {
        const neighbors = this.shuffledNeighbors(monster.tilePosition);
        const safe = neighbors
            .filter((tile) => this.isWalkable(tile))
            .filter((tile) => this.distance(tile, threat.tilePosition) > this.distance(monster.tilePosition, threat.tilePosition));
        return safe[0] ?? null;
    }

    shuffledNeighbors(origin) {
        const neighbors = [
            { x: origin.x + 1, y: origin.y },
            { x: origin.x - 1, y: origin.y },
            { x: origin.x, y: origin.y + 1 },
            { x: origin.x, y: origin.y - 1 }
        ];

        for (let i = neighbors.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [neighbors[i], neighbors[j]] = [neighbors[j], neighbors[i]];
        }
        return neighbors;
    }

    withinAnchor(tile, anchor, radius) {
        if (!anchor) {
            return true;
        }
        return Math.abs(tile.x - anchor.x) + Math.abs(tile.y - anchor.y) <= radius;
    }

    isWalkable(tile) {
        const withinBounds = tile.x >= 0 && tile.x < this.pathfindingEngine.dungeon.width && tile.y >= 0 && tile.y < this.pathfindingEngine.dungeon.height;
        if (!withinBounds) {
            return false;
        }
        const cell = this.pathfindingEngine.dungeon.tiles[tile.y][tile.x];
        if (cell !== TileType.FLOOR) {
            return false;
        }
        const occupant = this.turnEngine.getUnitAt(tile);
        return !occupant;
    }

    canSee(monster, target) {
        const sightRange = monster.getSightRange?.() ?? monster.stats?.sightRange ?? 0;
        return this.visionEngine?.canSee(monster.tilePosition, target.tilePosition, sightRange) ?? false;
    }

    distance(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }
}
