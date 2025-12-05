export class MovementManager {
    constructor({ turnEngine } = {}) {
        this.turnEngine = turnEngine;
        this.allowances = new Map();
    }

    registerUnit(unit) {
        if (!unit) {
            return;
        }
        this.allowances.set(unit, this.getMoveAllowance(unit));
    }

    unregisterUnit(unit) {
        this.allowances.delete(unit);
    }

    beginTurn(units = []) {
        units.forEach((unit) => {
            this.allowances.set(unit, this.getMoveAllowance(unit));
        });
    }

    async handleMoveAction(unit, action) {
        if (!unit) {
            return Promise.resolve(false);
        }
        const remaining = this.allowances.get(unit) ?? this.getMoveAllowance(unit);
        if (remaining <= 0) {
            return Promise.resolve(false);
        }

        const steps = this.extractSteps(unit, action, remaining);
        let successfulSteps = 0;

        for (const { dx, dy } of steps) {
            if (successfulSteps >= remaining) {
                break;
            }
            const moved = await unit.attemptMove(dx, dy);
            if (!moved) {
                break;
            }
            successfulSteps++;
        }

        this.allowances.set(unit, Math.max(0, remaining - successfulSteps));
        return successfulSteps > 0;
    }

    extractSteps(unit, action, maxSteps) {
        if (action?.path?.length) {
            const trimmedPath = action.path.slice(0, maxSteps);
            return trimmedPath.map((step) => ({ dx: step.x, dy: step.y }));
        }

        if (action?.dx !== undefined && action?.dy !== undefined) {
            return [{ dx: action.dx, dy: action.dy }];
        }

        const fallbackRange = Math.min(maxSteps, 1);
        return Array.from({ length: fallbackRange }).map(() => ({ dx: 0, dy: 0 }));
    }

    getMoveAllowance(unit) {
        const stats = unit?.stats ?? {};
        return Math.max(1, stats.movePoints ?? stats.mobility ?? 1);
    }
}
