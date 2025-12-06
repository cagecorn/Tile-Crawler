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

        const visibleThreats = (monsters ?? []).filter((monster) => monster?.isAlive?.() && this.canSee(member, monster));
        visibleThreats.sort((a, b) => this.distance(member.tilePosition, a.tilePosition) - this.distance(member.tilePosition, b.tilePosition));

        if (visibleThreats.length > 0) {
            return this.approachTarget(member, visibleThreats[0].tilePosition);
        }

        const distanceToPlayer = this.distance(member.tilePosition, player.tilePosition);
        if (distanceToPlayer > this.returnDistance) {
            const rallyTile = this.formationManager?.findEscortTile(player.tilePosition, { minDistance: 1, maxDistance: 2 }) ?? player.tilePosition;
            return this.approachTarget(member, rallyTile);
        }

        const escortTile = this.formationManager?.findEscortTile(player.tilePosition, { minDistance: 2, maxDistance: 4 }) ?? player.tilePosition;
        return this.approachTarget(member, escortTile);
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
            const escortTile = this.formationManager?.findEscortTile(wounded.tilePosition, { minDistance: 1, maxDistance: 2 }) ?? wounded.tilePosition;
            return this.approachTarget(member, escortTile);
        }

        const preferredEscort = this.formationManager?.findEscortTile(player.tilePosition, { minDistance: 1, maxDistance: 3 }) ?? player.tilePosition;
        return this.approachTarget(member, preferredEscort);
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

    distance(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }
}
