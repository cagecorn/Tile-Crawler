import { TileType } from '../dungeon/DungeonGenerator.js';

export class PlayerUnit {
    constructor(scene, startTile, tileSize, animationEngine, dungeon, classManager, specialEffectManager) {
        this.scene = scene;
        this.tileSize = tileSize;
        this.animationEngine = animationEngine;
        this.dungeon = dungeon;
        this.classManager = classManager;
        this.specialEffectManager = specialEffectManager;
        this.tilePosition = { ...startTile };
        const worldPosition = this.animationEngine.tileToWorldPosition(startTile, tileSize);
        this.sprite = this.scene.add.image(worldPosition.x, worldPosition.y, 'player');
        this.sprite.setDepth(10);

        this.stats = this.classManager.createStatsForClass('warrior');
        this.currentHealth = this.stats.health;
        this.maxHealth = this.stats.maxHealth;

        if (this.specialEffectManager) {
            this.specialEffectManager.trackUnitHealth(this, { width: this.tileSize * 0.9 });
        }
    }

    getHealthState() {
        return {
            current: this.currentHealth,
            max: this.maxHealth
        };
    }

    setHealth(value) {
        const clamped = Math.max(0, Math.min(value, this.maxHealth));
        if (clamped === this.currentHealth) {
            return;
        }
        this.currentHealth = clamped;
        if (this.specialEffectManager) {
            this.specialEffectManager.refreshUnit(this);
        }
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
