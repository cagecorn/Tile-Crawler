export class AnimationEngine {
    constructor(scene) {
        this.scene = scene;
    }

    moveToTile(sprite, toTile, tileSize, duration = 180) {
        const target = this.tileToWorldPosition(toTile, tileSize);
        return new Promise((resolve) => {
            this.scene.tweens.add({
                targets: sprite,
                x: target.x,
                y: target.y,
                duration,
                ease: 'Sine.easeInOut',
                onComplete: resolve
            });
        });
    }

    tileToWorldPosition(tile, tileSize) {
        return {
            x: tile.x * tileSize + tileSize / 2,
            y: tile.y * tileSize + tileSize / 2
        };
    }
}
