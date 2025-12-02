export class ActionOrderEngine {
    orderActions(actions) {
        return [...actions].sort((a, b) => this.getSpeed(b.unit) - this.getSpeed(a.unit));
    }

    orderUnits(units) {
        return [...units].sort((a, b) => this.getSpeed(b) - this.getSpeed(a));
    }

    getSpeed(unit) {
        return unit?.getActionSpeed?.() ?? 0;
    }
}

