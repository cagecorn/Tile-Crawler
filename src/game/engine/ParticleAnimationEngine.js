export class ParticleAnimationEngine {
    constructor(scene) {
        this.scene = scene;
        this.textureKey = 'blood-particle';
        this.bloodEmitter = null;

        this.ensureTexture();
        this.createEmitter();
    }

    ensureTexture() {
        if (this.scene.textures.exists(this.textureKey)) {
            return;
        }

        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0x8b0000, 1);
        graphics.fillEllipse(10, 10, 18, 12);
        graphics.generateTexture(this.textureKey, 20, 20);
        graphics.destroy();
    }

    createEmitter() {
        this.bloodEmitter = this.scene.add.particles(0, 0, this.textureKey, {
            on: false,
            lifespan: { min: 280, max: 520 },
            speed: { min: 90, max: 180 },
            angle: { min: 220, max: 320 },
            gravityY: 420,
            scale: { start: 1.4, end: 0.35 },
            alpha: { start: 0.9, end: 0 },
            quantity: 12,
            blendMode: 'NORMAL'
        });

        this.bloodEmitter.setDepth(18);
    }

    sprayBlood(target) {
        if (!target || !this.bloodEmitter) {
            return;
        }

        this.bloodEmitter.explode(16, target.x, target.y);
    }
}
