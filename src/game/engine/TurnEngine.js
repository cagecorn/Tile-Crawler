export class TurnEngine {
    constructor() {
        this.units = new Set();
        this.pendingActions = [];
        this.resolving = false;
    }

    registerUnit(unit) {
        this.units.add(unit);
    }

    queueAction(unit, action) {
        if (!this.units.has(unit)) {
            return;
        }
        this.pendingActions.push({ unit, action });
    }

    async resolveTurn() {
        if (this.resolving || this.pendingActions.length === 0) {
            return;
        }

        this.resolving = true;
        while (this.pendingActions.length > 0) {
            const actions = this.pendingActions.splice(0, this.pendingActions.length);
            await Promise.all(actions.map(({ unit, action }) => unit.performAction(action)));
        }
        this.resolving = false;
    }
}
