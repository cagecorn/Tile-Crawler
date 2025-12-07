export class PartyAiManager {
    constructor({ pathfindingEngine, visionEngine, turnEngine, formationManager, movementManager }) {
        this.pathfindingEngine = pathfindingEngine;
        this.visionEngine = visionEngine;
        this.turnEngine = turnEngine;
        this.formationManager = formationManager;
        this.movementManager = movementManager;
        this.returnDistance = 6;
    }

    planTurn(members = [], player, monsters = [], allies = []) {
        const living = members.filter((member) => member?.isAlive?.());
        living.forEach((member) => {
            const action = this.decide(member, player, monsters, allies);
            if (action) {
                this.turnEngine.queueAction(member, action);
            }
        });
    }

    decide(member, player, monsters, allies = []) {
        if (!member?.isAlive?.() || !player) {
            return null;
        }

        if (member.aiRole === 'medic') {
            return this.decideForMedic(member, player, monsters, allies);
        }

        if (member.aiRole === 'ranged') {
            return this.decideForRanged(member, player, monsters);
        }

        const visibleThreats = (monsters ?? []).filter((monster) => monster?.isAlive?.() && this.canSee(member, monster));
        visibleThreats.sort((a, b) => this.distance(member.tilePosition, a.tilePosition) - this.distance(member.tilePosition, b.tilePosition));

        if (visibleThreats.length > 0) {
            return this.approachTarget(member, visibleThreats[0].tilePosition);
        }

        const distanceToPlayer = this.distance(member.tilePosition, player.tilePosition);
        if (distanceToPlayer > this.returnDistance) {
            const rallyTile = this.formationManager?.findEscortTile(player.tilePosition, { minDistance: 1, maxDistance: 2 });
            return rallyTile ? this.approachTarget(member, rallyTile) : null;
        }

        const escortTile = this.formationManager?.findEscortTile(player.tilePosition, { minDistance: 2, maxDistance: 4 });
        return escortTile ? this.approachTarget(member, escortTile) : null;
    }

    decideForRanged(member, player, monsters = []) {
        const preferredRange = member.getPreferredEngagementRange?.() ?? { min: 2, max: member.getAttackRange?.() ?? 2 };
        const visibleThreats = (monsters ?? []).filter((monster) => monster?.isAlive?.() && this.canSee(member, monster));
        visibleThreats.sort((a, b) => this.distance(member.tilePosition, a.tilePosition) - this.distance(member.tilePosition, b.tilePosition));

        if (visibleThreats.length > 0) {
            const target = visibleThreats[0];
            const distance = this.distance(member.tilePosition, target.tilePosition);

            if (distance < preferredRange.min) {
                const retreatTile = this.findKitingTile(member, target, preferredRange);
                if (retreatTile) {
                    return this.approachTarget(member, retreatTile);
                }
            }

            if (distance > preferredRange.max) {
                return this.approachTarget(member, target.tilePosition);
            }

            const maintainTile = this.findKitingTile(member, target, preferredRange, { preferCurrentBand: true });
            if (maintainTile) {
                return this.approachTarget(member, maintainTile);
            }

            return null;
        }

        const escortTile = this.formationManager?.findEscortTile(player.tilePosition, { minDistance: 3, maxDistance: 5 });
        return escortTile ? this.approachTarget(member, escortTile) : null;
    }

    decideForMedic(member, player, monsters = [], allies = []) {
        const livingAllies = allies.filter((unit) => unit?.isAlive?.());
        const nearestThreat = this.findNearest(monsters, member);

        if (nearestThreat && this.distance(member.tilePosition, nearestThreat.tilePosition) <= 2) {
            const safeTile = this.findRetreatTile(member, player, nearestThreat);
            if (safeTile) {
                return this.approachTarget(member, safeTile);
            }
        }

        const wounded = this.findMostInjured(livingAllies);
        if (wounded) {
            const escortTile = this.formationManager?.findEscortTile(wounded.tilePosition, { minDistance: 1, maxDistance: 2 }) ?? null;
            return escortTile ? this.approachTarget(member, escortTile) : null;
        }

        const preferredEscort = this.formationManager?.findEscortTile(player.tilePosition, { minDistance: 1, maxDistance: 3 }) ?? null;
        return preferredEscort ? this.approachTarget(member, preferredEscort) : null;
    }

    findMostInjured(allies = []) {
        const wounded = allies
            .filter((unit) => unit?.currentHealth < unit?.maxHealth)
            .sort((a, b) => a.currentHealth / (a.maxHealth || 1) - b.currentHealth / (b.maxHealth || 1));

        return wounded[0] ?? null;
    }

    findRetreatTile(member, player, threat) {
        const candidates = this.formationManager?.collectRing?.(player.tilePosition, 1, 3) ?? [];
        const safeTiles = candidates
            .filter((tile) => this.formationManager?.isWalkable(tile))
            .filter((tile) => !this.turnEngine?.getUnitAt(tile))
            .filter((tile) => this.distance(tile, threat.tilePosition) > this.distance(member.tilePosition, threat.tilePosition));

        safeTiles.sort((a, b) => this.distance(player.tilePosition, a) - this.distance(player.tilePosition, b));
        return safeTiles[0] ?? null;
    }

    findNearest(targets = [], origin) {
        const living = targets.filter((target) => target?.isAlive?.());
        living.sort((a, b) => this.distance(origin.tilePosition, a.tilePosition) - this.distance(origin.tilePosition, b.tilePosition));
        return living[0] ?? null;
    }

    approachTarget(member, targetTile) {
        const path = this.pathfindingEngine?.findPath(member.tilePosition, targetTile) ?? [];
        if (path.length <= 1) {
            return null;
        }

        const stepBudget = this.movementManager?.getMoveAllowance(member) ?? 1;
        const deltas = [];
        for (let i = 1; i < path.length && deltas.length < stepBudget; i++) {
            const prev = path[i - 1];
            const current = path[i];
            deltas.push({ x: current.x - prev.x, y: current.y - prev.y });
        }

        return { type: 'move', path: deltas };
    }

    canSee(member, target) {
        const sight = member?.getSightRange?.() ?? 0;
        return this.visionEngine?.canSee(member.tilePosition, target.tilePosition, sight) ?? false;
    }

    findKitingTile(member, threat, preferredRange, { preferCurrentBand = false } = {}) {
        const ring = this.formationManager?.collectRing?.(threat.tilePosition, preferredRange.min, preferredRange.max) ?? [];
        const bandCandidates = ring
            .filter((tile) => this.formationManager?.isWalkable(tile))
            .filter((tile) => !this.turnEngine?.getUnitAt(tile))
            .filter((tile) => {
                const distance = this.distance(tile, threat.tilePosition);
                const currentDistance = this.distance(member.tilePosition, threat.tilePosition);
                return preferCurrentBand ? distance === currentDistance : distance > currentDistance;
            })
            .map((tile) => ({ tile, path: this.pathfindingEngine?.findPath(member.tilePosition, tile) ?? [] }))
            .filter(({ path }) => path.length > 1);

        if (bandCandidates.length > 0) {
            bandCandidates.sort((a, b) => b.path.length - a.path.length);
            return bandCandidates[0]?.tile ?? null;
        }

        const searchRadius = Math.max(preferredRange.max, 3);
        const fallbackRing = this.formationManager?.collectRing?.(member.tilePosition, 1, searchRadius) ?? [];
        const fallbackCandidates = fallbackRing
            .filter((tile) => this.formationManager?.isWalkable(tile))
            .filter((tile) => !this.turnEngine?.getUnitAt(tile))
            .filter((tile) => this.distance(tile, threat.tilePosition) > this.distance(member.tilePosition, threat.tilePosition))
            .map((tile) => ({ tile, path: this.pathfindingEngine?.findPath(member.tilePosition, tile) ?? [] }))
            .filter(({ path }) => path.length > 1);

        fallbackCandidates.sort((a, b) => {
            const distanceDelta = this.distance(b.tile, threat.tilePosition) - this.distance(a.tile, threat.tilePosition);
            if (distanceDelta !== 0) {
                return distanceDelta;
            }
            return a.path.length - b.path.length;
        });

        return fallbackCandidates[0]?.tile ?? null;
    }

    distance(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }
}
