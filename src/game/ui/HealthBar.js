export class HealthBar {
    constructor(scene, offscreenEngine, width, height) {
        this.scene = scene;
        this.width = width;
        this.height = height;
        this.layer = offscreenEngine.createLayer(width, height, { depth: 30 });
        this.layer.renderTexture.setOrigin(0.5, 1);
        this.currentHealth = 1;
        this.maxHealth = 1;
        this.target = null;
        this.offsetY = 0;
        this.drawBar();
    }

    attachTo(target, offsetY = 0) {
        this.target = target;
        this.offsetY = offsetY;
        this.syncPosition();
    }

    setHealth(current, max) {
        this.currentHealth = Math.max(0, current);
        this.maxHealth = Math.max(1, max);
        this.drawBar();
    }

    syncPosition() {
        if (!this.target) {
            return;
        }
        this.layer.setPosition(this.target.x, this.target.y + this.offsetY);
    }

    drawBar() {
        const percentage = Math.min(1, this.currentHealth / this.maxHealth);
        this.layer.draw((graphics, scaleFactor, baseWidth, baseHeight) => {
            const width = baseWidth * scaleFactor;
            const height = baseHeight * scaleFactor;
            const padding = 2 * scaleFactor;
            const radius = height / 2;

            graphics.fillStyle(0x000000, 0.45);
            graphics.fillRoundedRect(0, 0, width, height, radius);

            const innerWidth = width - padding * 2;
            const innerHeight = height - padding * 2;
            const filledWidth = innerWidth * percentage;

            graphics.fillStyle(0x4b1b0b, 0.8);
            graphics.fillRoundedRect(padding, padding, innerWidth, innerHeight, innerHeight / 2);
            graphics.fillStyle(0xd32f2f, 0.95);
            graphics.fillRoundedRect(padding, padding, filledWidth, innerHeight, innerHeight / 2);
        });
    }

    destroy() {
        this.layer.renderTexture.destroy();
    }
}
