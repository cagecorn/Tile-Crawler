import { chargeSkill } from './definitions/charge.js';

export function registerCoreSkills(skillEngine) {
    if (!skillEngine) {
        return;
    }
    skillEngine.registerSkill(chargeSkill);
}
