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

    showHeal(target, amount) {
        this.showFloatingText(`+${amount}`, target, {
            color: '#d1ffef',
            stroke: '#0f6e4f',
            duration: 720,
            rise: 34,
            fontSize: '26px',
            strokeThickness: 4
        });
    }

    showSkillCallout(target, { name = '스킬', iconKey = null } = {}) {
        if (!target || !this.scene) {
            return;
        }

        const anchorY = target.y - target.displayHeight / 2 - 6;
        const title = this.scene.add.text(target.x, anchorY, name, {
            fontSize: '24px',
            fontFamily: 'Arial Black, Arial, sans-serif',
            color: '#ffe09a',
            stroke: '#7f4a00',
            strokeThickness: 4,
            align: 'center'
        });

        title.setOrigin(0.5);
        title.setDepth(52);

        this.scene.tweens.add({
            targets: title,
            y: title.y - 14,
            alpha: 0,
            duration: 780,
            ease: 'Cubic.easeOut',
            onComplete: () => title.destroy()
        });

        const resolvedIconKey = iconKey && this.scene.textures.exists(iconKey) ? iconKey : null;
        if (!resolvedIconKey) {
            return;
        }

        const icon = this.scene.add.image(target.x, anchorY - 18, resolvedIconKey);
        icon.setDepth(51);
        icon.setScale(0.6);

        this.scene.tweens.add({
            targets: icon,
            scale: 1.25,
            y: icon.y - 10,
            alpha: 0,
            duration: 720,
            ease: 'Back.easeOut',
            onComplete: () => icon.destroy()
        });
    }
}
