export class SnipeAiNode {
    constructor({ skillEngine, visionEngine }) {
        this.skillEngine = skillEngine;
        this.visionEngine = visionEngine;
    }

    decide(unit, enemies = []) {
        if (!this.skillEngine?.canUseSkill(unit, 'snipe')) {
            return null;
        }

        const skill = this.skillEngine.getSkill('snipe');
        const targetUnit = skill?.selectTarget?.({
            user: unit,
            enemies,
            visionEngine: this.visionEngine
        });

        if (!targetUnit) {
            return null;
        }

        return {
            type: 'skill',
            skillId: 'snipe',
            targetUnit
        };
    }
}
