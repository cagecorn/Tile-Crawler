import { CORE_EVENT_TOPICS } from '../engine/EventEngine.js';

export class PlayerSkillManager {
    constructor({ skillEngine, availableSlots = ['KeyQ', 'KeyW'], eventEngine = null } = {}) {
        this.skillEngine = skillEngine;
        this.availableSlots = availableSlots;
        this.learnedActive = new Set();
        this.learnedPassive = new Set();
        this.equippedSlots = new Map();
        this.listeners = new Set();
        this.player = null;
        this.eventEngine = eventEngine;

        this.availableSlots.forEach((slot) => this.equippedSlots.set(slot, null));
    }

    bindPlayer(player) {
        this.player = player;
        this.syncLearnedSkills();
    }

    learnSkill(skillId) {
        const skill = this.skillEngine?.getSkill(skillId);
        if (!skill) {
            return false;
        }

        const bucket = skill.type === 'passive' ? this.learnedPassive : this.learnedActive;
        if (bucket.has(skillId)) {
            return false;
        }

        bucket.add(skillId);
        if (this.player) {
            this.skillEngine?.grantSkillToUnit(this.player, skillId);
        }
        this.emitChange();
        return true;
    }

    syncLearnedSkills() {
        if (!this.player || !this.skillEngine) {
            return;
        }
        [...this.learnedActive, ...this.learnedPassive].forEach((skillId) => {
            this.skillEngine.grantSkillToUnit(this.player, skillId);
        });
    }

    getLearnedActive() {
        return Array.from(this.learnedActive);
    }

    getLearnedPassive() {
        return Array.from(this.learnedPassive);
    }

    getAssignedSkill(keyCode) {
        return this.equippedSlots.get(keyCode) ?? null;
    }

    assignToSlot(keyCode, skillId) {
        if (!this.availableSlots.includes(keyCode) || !this.learnedActive.has(skillId)) {
            return false;
        }

        this.equippedSlots.set(keyCode, skillId);
        this.emitChange();
        return true;
    }

    clearSlot(keyCode) {
        if (!this.availableSlots.includes(keyCode)) {
            return false;
        }
        this.equippedSlots.set(keyCode, null);
        this.emitChange();
        return true;
    }

    onChange(listener) {
        if (listener) {
            this.listeners.add(listener);
        }
    }

    emitChange() {
        this.listeners.forEach((listener) => listener?.());
        this.eventEngine?.emit(CORE_EVENT_TOPICS.PLAYER_SKILL_CHANGED, {
            player: this.player,
            slots: this.getTrackedAssignments(),
            learnedActive: this.getLearnedActive(),
            learnedPassive: this.getLearnedPassive()
        });
    }

    getTrackedAssignments() {
        return this.availableSlots.reduce((acc, slotKey) => {
            acc[slotKey] = this.getAssignedSkill(slotKey);
            return acc;
        }, {});
    }
}
