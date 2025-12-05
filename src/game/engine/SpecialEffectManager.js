import { HealthBar } from '../ui/HealthBar.js';

export class SpecialEffectManager {
    constructor(scene, offscreenEngine) {
        this.scene = scene;
        this.offscreenEngine = offscreenEngine;
        this.healthBars = new Map();
        this.shadows = new Map();
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

    attachShadow(unit, { width, height, offset } = {}) {
        if (this.shadows.has(unit)) {
            return this.shadows.get(unit);
        }

        const shadowWidth = width ?? unit.tileSize * 0.78;
        const shadowHeight = height ?? unit.tileSize * 0.34;
        const effectiveOffset = offset ?? unit.sprite.displayHeight / 2 - shadowHeight * 0.2;

        const ellipse = this.scene.add.ellipse(
            unit.sprite.x,
            unit.sprite.y + effectiveOffset,
            shadowWidth,
            shadowHeight,
            0x000000,
            0.26
        );

        ellipse.setDepth((unit.sprite.depth ?? 10) - 2);
        this.shadows.set(unit, { ellipse, offset: effectiveOffset });
        return ellipse;
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

    stopTracking(unit) {
        const healthBar = this.healthBars.get(unit);
        if (!healthBar) {
            return this.detachShadow(unit);
        }
        healthBar.destroy();
        this.healthBars.delete(unit);
        this.detachShadow(unit);
    }

    update() {
        this.healthBars.forEach((healthBar, unit) => {
            const { current, max } = unit.getHealthState();
            healthBar.setHealth(current, max);
            healthBar.syncPosition();
        });

        this.shadows.forEach((shadow, unit) => {
            const { ellipse, offset } = shadow;
            ellipse.setPosition(unit.sprite.x, unit.sprite.y + offset);
        });
    }

    detachShadow(unit) {
        const shadow = this.shadows.get(unit);
        if (!shadow) {
            return;
        }

        shadow.ellipse.destroy();
        this.shadows.delete(unit);
    }
}
