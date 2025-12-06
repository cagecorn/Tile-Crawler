import { chargeSkill } from './definitions/charge.js';
import { healSkill } from './definitions/heal.js';

export function registerCoreSkills(skillEngine) {
    if (!skillEngine) {
        return;
    }
    skillEngine.registerSkill(chargeSkill);
    skillEngine.registerSkill(healSkill);
}
