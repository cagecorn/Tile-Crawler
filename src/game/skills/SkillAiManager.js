import { ChargeAiNode } from './nodes/ChargeAiNode.js';
import { HealAiNode } from './nodes/HealAiNode.js';
import { SnipeAiNode } from './nodes/SnipeAiNode.js';

export class SkillAiManager {
    constructor({ skillEngine, visionEngine, pathfindingEngine }) {
        this.skillEngine = skillEngine;
        this.visionEngine = visionEngine;
        this.pathfindingEngine = pathfindingEngine;

        this.nodes = {
            charge: new ChargeAiNode({ skillEngine, visionEngine, pathfindingEngine }),
            heal: new HealAiNode({ skillEngine, visionEngine }),
            snipe: new SnipeAiNode({ skillEngine, visionEngine })
        };
    }

    decide(unit, enemies = [], { allies = [] } = {}) {
        if (!unit || !this.skillEngine) {
            return null;
        }

        const skills = this.skillEngine.getUnitSkills(unit, 'active');
        for (const skillId of skills) {
            const node = this.nodes[skillId];
            const action = node?.decide(unit, enemies, { allies });
            if (action) {
                return action;
            }
        }

        return null;
    }
}
