import { TileType } from '../dungeon/DungeonGenerator.js';

export class PlayerUnit {
    constructor(scene, startTile, tileSize, animationEngine, dungeon) {
        this.scene = scene;
        this.tileSize = tileSize;
        this.animationEngine = animationEngine;
        this.dungeon = dungeon;
        this.tilePosition = { ...startTile };
        const worldPosition = this.animationEngine.tileToWorldPosition(startTile, tileSize);
        this.sprite = this.scene.add.image(worldPosition.x, worldPosition.y, 'player');
        this.sprite.setDepth(10);
    }

    performAction(action) {
        if (!action) {
            return Promise.resolve();
        }

        if (action.type === 'move') {
            return this.attemptMove(action.dx, action.dy);
        }

        return Promise.resolve();
    }

    attemptMove(dx, dy) {
        const target = { x: this.tilePosition.x + dx, y: this.tilePosition.y + dy };
        if (!this.canOccupy(target)) {
            return Promise.resolve();
        }

        this.tilePosition = target;
        return this.animationEngine.moveToTile(this.sprite, target, this.tileSize);
    }

    canOccupy(tile) {
        const withinBounds = tile.x >= 0 && tile.x < this.dungeon.width && tile.y >= 0 && tile.y < this.dungeon.height;
        if (!withinBounds) {
            return false;
        }
        return this.dungeon.tiles[tile.y][tile.x] === TileType.FLOOR;
    }
}
