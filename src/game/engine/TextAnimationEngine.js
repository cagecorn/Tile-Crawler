export class TextAnimationEngine {
    constructor(scene) {
        this.scene = scene;
    }

    showFloatingText(message, target, {
        color = '#ffecec',
        stroke = '#7f0000',
        duration = 650,
        rise = 28,
        fontSize = '22px',
        strokeThickness = 3
    } = {}) {
        if (!target || !message) {
            return;
        }

        const text = this.scene.add.text(target.x, target.y - target.displayHeight / 2, message, {
            fontSize,
            fontFamily: 'Arial Black, Arial, sans-serif',
            color,
            stroke,
            strokeThickness,
            align: 'center'
        });

        text.setOrigin(0.5);
        text.setDepth(40);

        this.scene.tweens.add({
            targets: text,
            y: text.y - rise,
            alpha: 0,
            duration,
            ease: 'Cubic.easeOut',
            onComplete: () => text.destroy()
        });
    }

    showDamage(target, amount) {
        this.showFloatingText(`${amount}`, target, {
            color: '#ffdede',
            stroke: '#8b0000',
            duration: 720,
            rise: 40,
            fontSize: '28px',
            strokeThickness: 4
        });
    }
}
