export class HealAiNode {
    constructor({ skillEngine, visionEngine }) {
        this.skillEngine = skillEngine;
        this.visionEngine = visionEngine;
    }

    decide(unit, _enemies = [], { allies = [] } = {}) {
        if (!this.skillEngine?.canUseSkill(unit, 'heal')) {
            return null;
        }

        const skill = this.skillEngine.getSkill('heal');
        const targetUnit = skill?.selectTarget?.({
            user: unit,
            allies,
            visionEngine: this.visionEngine
        });

        if (!targetUnit) {
            return null;
        }

        return {
            type: 'skill',
            skillId: 'heal',
            targetUnit
        };
    }
}
