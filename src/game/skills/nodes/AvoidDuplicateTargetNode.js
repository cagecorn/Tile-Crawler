export class TargetReservation {
    constructor() {
        this.targets = new WeakSet();
    }

    beginTurn() {
        this.targets = new WeakSet();
    }

    reserve(unit) {
        if (unit) {
            this.targets.add(unit);
        }
    }

    isReserved(unit) {
        return unit ? this.targets.has(unit) : false;
    }
}

export class AvoidDuplicateTargetNode {
    constructor({ node, reservation }) {
        this.node = node;
        this.reservation = reservation;
    }

    decide(unit, enemies = [], context = {}) {
        const action = this.node?.decide?.(unit, enemies, context);
        if (!action) {
            return null;
        }

        const targetUnit = action.targetUnit ?? null;
        if (targetUnit && this.reservation?.isReserved(targetUnit)) {
            return null;
        }

        if (targetUnit) {
            this.reservation?.reserve(targetUnit);
        }

        return action;
    }
}

