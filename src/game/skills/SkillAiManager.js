import { ChargeAiNode } from './nodes/ChargeAiNode.js';

export class SkillAiManager {
    constructor({ skillEngine, visionEngine, pathfindingEngine }) {
        this.skillEngine = skillEngine;
        this.visionEngine = visionEngine;
        this.pathfindingEngine = pathfindingEngine;

        this.nodes = {
            charge: new ChargeAiNode({ skillEngine, visionEngine, pathfindingEngine })
        };
    }

    decide(unit, enemies = []) {
        if (!unit || !this.skillEngine) {
            return null;
        }

        const skills = this.skillEngine.getUnitSkills(unit, 'active');
        for (const skillId of skills) {
            const node = this.nodes[skillId];
            const action = node?.decide(unit, enemies);
            if (action) {
                return action;
            }
        }

        return null;
    }
}
