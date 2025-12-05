import { TileType } from '../dungeon/DungeonGenerator.js';

export class Unit {
    constructor({
        scene,
        startTile,
        tileSize,
        animationEngine,
        dungeon,
        specialEffectManager,
        turnEngine,
        textureKey,
        stats,
        faction
    }) {
        this.scene = scene;
        this.tileSize = tileSize;
        this.animationEngine = animationEngine;
        this.dungeon = dungeon;
        this.specialEffectManager = specialEffectManager;
        this.turnEngine = turnEngine;
        this.stats = stats;
        this.faction = faction;
        this.tilePosition = { ...startTile };
        this.currentHealth = this.stats.health;
        this.maxHealth = this.stats.maxHealth;

        const worldPosition = this.animationEngine.tileToWorldPosition(startTile, tileSize);
        this.sprite = this.scene.add.image(worldPosition.x, worldPosition.y, textureKey);
        this.sprite.setDepth(10);

        if (this.turnEngine) {
            this.turnEngine.registerUnit(this);
        }

        if (this.specialEffectManager) {
            this.specialEffectManager.trackUnitHealth(this, { width: this.tileSize * 0.9 });
        }
    }

    getActionSpeed() {
        return this.stats.actionSpeed ?? 0;
    }

    getSightRange() {
        return this.stats.sightRange ?? 0;
    }

    isAlive() {
        return this.currentHealth > 0;
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

        if (!this.isAlive()) {
            this.handleDeath();
        }
    }

    handleDeath() {
        if (this.turnEngine) {
            this.turnEngine.unregisterUnit(this);
        }
        if (this.specialEffectManager) {
            this.specialEffectManager.stopTracking(this);
        }
        if (this.sprite) {
            this.sprite.destroy();
        }
    }

    performAction(action) {
        if (!action || !this.isAlive()) {
            return Promise.resolve();
        }

        if (action.type === 'move') {
            return this.attemptMove(action.dx, action.dy);
        }

        return Promise.resolve();
    }

    attemptMove(dx, dy) {
        const target = { x: this.tilePosition.x + dx, y: this.tilePosition.y + dy };
        if (!this.isWalkable(target)) {
            return Promise.resolve(false);
        }

        const occupant = this.turnEngine?.getUnitAt(target);
        if (occupant && occupant !== this) {
            if (occupant.faction !== this.faction) {
                return this.turnEngine.engageUnits(this, occupant);
            }
            return Promise.resolve(false);
        }

        this.turnEngine?.updateUnitPosition(this, target);
        this.tilePosition = target;
        this.scene?.events.emit('unit-moved', { unit: this, tile: target });
        return this.animationEngine.moveToTile(this.sprite, target, this.tileSize).then(() => true);
    }

    isWalkable(tile) {
        const withinBounds = tile.x >= 0 && tile.x < this.dungeon.width && tile.y >= 0 && tile.y < this.dungeon.height;
        if (!withinBounds) {
            return false;
        }
        return this.dungeon.tiles[tile.y][tile.x] === TileType.FLOOR;
    }
}

