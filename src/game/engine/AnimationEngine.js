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

    moveAlongPath(sprite, tiles, tileSize, durationPerStep = 120) {
        if (!Array.isArray(tiles) || tiles.length === 0) {
            return Promise.resolve();
        }

        const tweens = tiles.map((tile, index) => {
            const target = this.tileToWorldPosition(tile, tileSize);
            return {
                x: target.x,
                y: target.y,
                duration: Math.max(60, durationPerStep - index * 6),
                ease: 'Sine.easeInOut'
            };
        });

        return tweens.reduce((sequence, tweenConfig) => {
            return sequence.then(() => new Promise((resolve) => {
                this.scene.tweens.add({
                    targets: sprite,
                    ...tweenConfig,
                    onComplete: resolve
                });
            }));
        }, Promise.resolve());
    }

    tileToWorldPosition(tile, tileSize) {
        return {
            x: tile.x * tileSize + tileSize / 2,
            y: tile.y * tileSize + tileSize / 2
        };
    }
}
