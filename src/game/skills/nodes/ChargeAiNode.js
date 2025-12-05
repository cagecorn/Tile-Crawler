export class ChargeAiNode {
    constructor({ skillEngine, visionEngine, pathfindingEngine }) {
        this.skillEngine = skillEngine;
        this.visionEngine = visionEngine;
        this.pathfindingEngine = pathfindingEngine;
    }

    decide(unit, enemies = []) {
        if (!this.skillEngine?.canUseSkill(unit, 'charge')) {
            return null;
        }

        const skill = this.skillEngine.getSkill('charge');
        const targetUnit = skill?.selectTarget?.({
            user: unit,
            enemies,
            visionEngine: this.visionEngine
        });

        if (!targetUnit) {
            return null;
        }

        const landing = this.skillEngine.findAdjacentLanding(unit, targetUnit);
        if (!landing) {
            return null;
        }

        const path = this.pathfindingEngine?.findPath(unit.tilePosition, landing) ?? [];
        if (path.length <= 1) {
            return null;
        }

        return {
            type: 'skill',
            skillId: 'charge',
            targetUnit
        };
    }
}
