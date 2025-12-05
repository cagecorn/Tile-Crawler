export class PlayerSkillMechanismManager {
    constructor({ skillEngine, playerSkillManager, monsterProvider, visionEngine }) {
        this.skillEngine = skillEngine;
        this.playerSkillManager = playerSkillManager;
        this.monsterProvider = monsterProvider;
        this.visionEngine = visionEngine;
        this.player = null;
    }

    bindPlayer(player) {
        this.player = player;
    }

    translateKeyToSkill(keyCode) {
        const skillId = this.playerSkillManager?.getAssignedSkill(keyCode);
        if (!skillId || !this.player) {
            return null;
        }

        const skill = this.skillEngine?.getSkill(skillId);
        if (!skill) {
            return null;
        }

        const enemies = this.monsterProvider?.() ?? [];
        const targetUnit = skill.selectTarget?.({
            user: this.player,
            enemies,
            visionEngine: this.visionEngine
        });

        if (!targetUnit) {
            return null;
        }

        return {
            type: 'skill',
            skillId,
            targetUnit
        };
    }
}
