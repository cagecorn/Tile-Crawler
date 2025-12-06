export class PlayerSkillMechanismManager {
    constructor({ skillEngine, playerSkillManager, monsterProvider, visionEngine, allyProvider }) {
        this.skillEngine = skillEngine;
        this.playerSkillManager = playerSkillManager;
        this.monsterProvider = monsterProvider;
        this.visionEngine = visionEngine;
        this.player = null;
        this.allyProvider = allyProvider;
    }

    bindPlayer(player) {
        this.player = player;
    }

    setAllyProvider(allyProvider) {
        this.allyProvider = allyProvider;
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
        const allies = this.allyProvider?.() ?? [];
        const targetUnit = skill.selectTarget?.({
            user: this.player,
            enemies,
            allies,
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
