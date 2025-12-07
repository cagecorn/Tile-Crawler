import { chargeSkill } from './definitions/charge.js';
import { healSkill } from './definitions/heal.js';
import { snipeSkill } from './definitions/snipe.js';
import { battleCrySkill } from './definitions/battleCry.js';
import { fireballSkill } from './definitions/fireball.js';
import { rendingStrikeSkill } from './definitions/rendingStrike.js';

export function registerCoreSkills(skillEngine) {
    if (!skillEngine) {
        return;
    }
    skillEngine.registerSkill(battleCrySkill);
    skillEngine.registerSkill(fireballSkill);
    skillEngine.registerSkill(rendingStrikeSkill);
    skillEngine.registerSkill(chargeSkill);
    skillEngine.registerSkill(healSkill);
    skillEngine.registerSkill(snipeSkill);
}
