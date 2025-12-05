export class ParticleAnimationEngine {
    constructor(scene) {
        this.scene = scene;
        this.textureKey = 'blood-particle';
        this.particles = null;
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
        graphics.fillEllipse(6, 6, 10, 6);
        graphics.generateTexture(this.textureKey, 12, 12);
        graphics.destroy();
    }

    createEmitter() {
        this.particles = this.scene.add.particles(this.textureKey);
        this.particles.setDepth(18);

        this.bloodEmitter = this.particles.addEmitter({
            on: false,
            lifespan: { min: 220, max: 420 },
            speed: { min: 70, max: 160 },
            angle: { min: 220, max: 320 },
            gravityY: 420,
            scale: { start: 0.9, end: 0.2 },
            alpha: { start: 0.9, end: 0 },
            quantity: 10,
            blendMode: 'NORMAL'
        });
    }

    sprayBlood(target) {
        if (!target || !this.bloodEmitter) {
            return;
        }

        this.bloodEmitter.explode(12, target.x, target.y);
    }
}
