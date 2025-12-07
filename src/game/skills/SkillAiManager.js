import { ChargeAiNode } from './nodes/ChargeAiNode.js';
import { HealAiNode } from './nodes/HealAiNode.js';
import { SnipeAiNode } from './nodes/SnipeAiNode.js';
import { AvoidDuplicateTargetNode, TargetReservation } from './nodes/AvoidDuplicateTargetNode.js';

export class SkillAiManager {
    constructor({ skillEngine, visionEngine, pathfindingEngine }) {
        this.skillEngine = skillEngine;
        this.visionEngine = visionEngine;
        this.pathfindingEngine = pathfindingEngine;
        this.targetReservation = new TargetReservation();

        this.nodes = {
            charge: new ChargeAiNode({ skillEngine, visionEngine, pathfindingEngine }),
            heal: new AvoidDuplicateTargetNode({
                node: new HealAiNode({ skillEngine, visionEngine }),
                reservation: this.targetReservation
            }),
            snipe: new SnipeAiNode({ skillEngine, visionEngine })
        };
    }

    beginTurn() {
        this.targetReservation?.beginTurn();
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
