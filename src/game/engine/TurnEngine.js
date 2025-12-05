export class TurnEngine {
    constructor(actionOrderEngine) {
        this.units = new Set();
        this.pendingActions = new Map();
        this.resolving = false;
        this.positions = new Map();
        this.actionOrderEngine = actionOrderEngine;
        this.combatEngine = null;
        this.movementManager = null;
    }

    setCombatEngine(combatEngine) {
        this.combatEngine = combatEngine;
    }

    setMovementManager(movementManager) {
        this.movementManager = movementManager;
    }

    registerUnit(unit) {
        this.units.add(unit);
        const key = this.key(unit.tilePosition);
        this.positions.set(key, unit);
        this.movementManager?.registerUnit(unit);
    }

    unregisterUnit(unit) {
        this.units.delete(unit);
        for (const [key, trackedUnit] of this.positions.entries()) {
            if (trackedUnit === unit) {
                this.positions.delete(key);
            }
        }
        this.movementManager?.unregisterUnit(unit);
    }

    queueAction(unit, action) {
        if (!this.units.has(unit)) {
            return;
        }
        this.pendingActions.set(unit, action);
    }

    async resolveTurn() {
        if (this.resolving || this.pendingActions.size === 0) {
            return;
        }

        this.resolving = true;
        const actions = [...this.pendingActions.entries()].map(([unit, action]) => ({ unit, action }));
        this.pendingActions.clear();
        const orderedActions = this.actionOrderEngine?.orderActions(actions) ?? actions;

        this.movementManager?.beginTurn(this.units);

        const actionPromises = orderedActions.map(({ unit, action }) => unit.performAction(action));
        await Promise.all(actionPromises);
        this.resolving = false;
    }

    getUnitAt(tile) {
        return this.positions.get(this.key(tile));
    }

    updateUnitPosition(unit, newTile) {
        for (const [key, trackedUnit] of this.positions.entries()) {
            if (trackedUnit === unit) {
                this.positions.delete(key);
                break;
            }
        }
        this.positions.set(this.key(newTile), unit);
    }

    swapUnitPositions(unitA, unitB) {
        if (!unitA || !unitB) {
            return;
        }

        const keyA = this.key(unitA.tilePosition);
        const keyB = this.key(unitB.tilePosition);

        this.positions.delete(keyA);
        this.positions.delete(keyB);

        this.positions.set(keyA, unitB);
        this.positions.set(keyB, unitA);
    }

    engageUnits(unitA, unitB) {
        if (!this.combatEngine) {
            return Promise.resolve();
        }
        return this.combatEngine.resolveEngagement(unitA, unitB);
    }

    key(tile) {
        return `${tile.x},${tile.y}`;
    }
}
