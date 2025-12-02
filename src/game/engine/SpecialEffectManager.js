import { HealthBar } from '../ui/HealthBar.js';

export class SpecialEffectManager {
    constructor(scene, offscreenEngine) {
        this.scene = scene;
        this.offscreenEngine = offscreenEngine;
        this.healthBars = new Map();
    }

    trackUnitHealth(unit, { width, height = 10, offset } = {}) {
        const barWidth = width ?? unit.tileSize;
        const healthBar = new HealthBar(this.scene, this.offscreenEngine, barWidth, height);
        const effectiveOffset = offset ?? -(unit.sprite.displayHeight / 2 + height / 2);

        healthBar.attachTo(unit.sprite, effectiveOffset);
        this.healthBars.set(unit, healthBar);
        this.refreshUnit(unit);
        return healthBar;
    }

    refreshUnit(unit) {
        const healthBar = this.healthBars.get(unit);
        if (!healthBar) {
            return;
        }
        const { current, max } = unit.getHealthState();
        healthBar.setHealth(current, max);
        healthBar.syncPosition();
    }

    update() {
        this.healthBars.forEach((healthBar, unit) => {
            const { current, max } = unit.getHealthState();
            healthBar.setHealth(current, max);
            healthBar.syncPosition();
        });
    }
}
