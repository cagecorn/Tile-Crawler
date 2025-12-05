export class PartyAiManager {
    constructor({ pathfindingEngine, visionEngine, turnEngine, formationManager, movementManager }) {
        this.pathfindingEngine = pathfindingEngine;
        this.visionEngine = visionEngine;
        this.turnEngine = turnEngine;
        this.formationManager = formationManager;
        this.movementManager = movementManager;
        this.returnDistance = 6;
    }

    planTurn(members = [], player, monsters = []) {
        const living = members.filter((member) => member?.isAlive?.());
        living.forEach((member) => {
            const action = this.decide(member, player, monsters);
            if (action) {
                this.turnEngine.queueAction(member, action);
            }
        });
    }

    decide(member, player, monsters) {
        if (!member?.isAlive?.() || !player) {
            return null;
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
