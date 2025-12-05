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
        movementManager,
        textureKey,
        stats,
        faction,
        name
    }) {
        this.scene = scene;
        this.tileSize = tileSize;
        this.animationEngine = animationEngine;
        this.dungeon = dungeon;
        this.specialEffectManager = specialEffectManager;
        this.turnEngine = turnEngine;
        this.movementManager = movementManager;
        this.baseStats = { ...stats };
        this.stats = { ...stats };
        this.faction = faction;
        this.name = name ?? textureKey;
        this.tilePosition = { ...startTile };
        this.currentHealth = this.stats.health;
        this.maxHealth = this.stats.maxHealth;
        this.currentMana = this.stats.mana;
        this.maxMana = this.stats.maxMana;

        const worldPosition = this.animationEngine.tileToWorldPosition(startTile, tileSize);
        this.sprite = this.scene.add.image(worldPosition.x, worldPosition.y, textureKey);
        this.sprite.setDepth(10);

        this.specialEffectManager?.attachShadow(this, { offset: this.sprite.displayHeight / 2 - this.tileSize * 0.15 });

        if (this.turnEngine) {
            this.turnEngine.registerUnit(this);
        }

        if (this.specialEffectManager) {
            this.specialEffectManager.trackUnitHealth(this, { width: this.tileSize * 0.9 });
        }

        this.emitHealthChanged();
        this.emitManaChanged();
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

    getName() {
        return this.name;
    }

    getManaState() {
        return {
            current: this.currentMana,
            max: this.maxMana
        };
    }

    applyStatModifiers(modifiers = {}) {
        const merged = { ...this.baseStats };
        Object.entries(modifiers).forEach(([key, value]) => {
            if (typeof value === 'number') {
                merged[key] = (merged[key] ?? 0) + value;
            }
        });

        this.stats = merged;
        this.maxHealth = merged.maxHealth ?? merged.health ?? this.maxHealth;
        this.maxMana = merged.maxMana ?? merged.mana ?? this.maxMana;
        this.currentHealth = Math.min(this.currentHealth, this.maxHealth);
        this.currentMana = Math.min(this.currentMana, this.maxMana);
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

        this.emitHealthChanged();

        if (!this.isAlive()) {
            this.handleDeath();
        }
    }

    setMana(value) {
        const clamped = Math.max(0, Math.min(value, this.maxMana));
        if (clamped === this.currentMana) {
            return;
        }
        this.currentMana = clamped;
        this.emitManaChanged();
    }

    handleDeath() {
        if (this.turnEngine) {
            this.turnEngine.unregisterUnit(this);
        }
        if (this.specialEffectManager) {
            this.specialEffectManager.stopTracking(this);
        }
        this.scene?.events.emit('unit-died', { unit: this, tile: { ...this.tilePosition } });
        if (this.sprite) {
            this.sprite.destroy();
        }
    }

    performAction(action) {
        if (!action || !this.isAlive()) {
            return Promise.resolve();
        }

        if (action.type === 'move') {
            if (this.movementManager) {
                return this.movementManager.handleMoveAction(this, action);
            }
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
            if (this.canSwapWith(occupant)) {
                return this.swapPositionsWith(occupant);
            }
            return Promise.resolve(false);
        }

        this.turnEngine?.updateUnitPosition(this, target);
        this.tilePosition = target;
        this.scene?.events.emit('unit-moved', { unit: this, tile: target });
        return this.animationEngine.moveToTile(this.sprite, target, this.tileSize).then(() => true);
    }

    async attemptPath(steps = []) {
        if (!Array.isArray(steps) || steps.length === 0) {
            return 0;
        }

        const traversed = [];
        let swapRequest = null;

        for (const { dx = 0, dy = 0 } of steps) {
            const target = { x: this.tilePosition.x + dx, y: this.tilePosition.y + dy };
            if (!this.isWalkable(target)) {
                break;
            }

            const occupant = this.turnEngine?.getUnitAt(target);
            if (occupant && occupant !== this) {
                if (occupant.faction !== this.faction) {
                    await this.turnEngine.engageUnits(this, occupant);
                    return traversed.length;
                }
                if (this.canSwapWith(occupant)) {
                    swapRequest = occupant;
                    break;
                }
                break;
            }

            this.turnEngine?.updateUnitPosition(this, target);
            this.tilePosition = target;
            traversed.push({ ...target });
        }

        if (!traversed.length && !swapRequest) {
            return 0;
        }

        if (traversed.length) {
            const finalTile = traversed[traversed.length - 1];
            this.scene?.events.emit('unit-moved', { unit: this, tile: finalTile });
            await this.animationEngine.moveAlongPath(this.sprite, traversed, this.tileSize);
        }

        if (swapRequest) {
            const swapped = await this.swapPositionsWith(swapRequest);
            return swapped ? traversed.length + 1 : traversed.length;
        }

        return traversed.length;
    }

    isWalkable(tile) {
        const withinBounds = tile.x >= 0 && tile.x < this.dungeon.width && tile.y >= 0 && tile.y < this.dungeon.height;
        if (!withinBounds) {
            return false;
        }
        return this.dungeon.tiles[tile.y][tile.x] === TileType.FLOOR;
    }

    emitHealthChanged() {
        this.scene?.events.emit('unit-health-changed', {
            unit: this,
            current: this.currentHealth,
            max: this.maxHealth
        });
    }

    emitManaChanged() {
        this.scene?.events.emit('unit-mana-changed', {
            unit: this,
            current: this.currentMana,
            max: this.maxMana
        });
    }

    canSwapWith() {
        return false;
    }

    swapPositionsWith(otherUnit) {
        if (!otherUnit || !this.turnEngine) {
            return Promise.resolve(false);
        }

        const origin = { ...this.tilePosition };
        const destination = { ...otherUnit.tilePosition };

        this.turnEngine.swapUnitPositions(this, otherUnit);
        this.tilePosition = destination;
        otherUnit.tilePosition = origin;

        this.scene?.events.emit('unit-moved', { unit: this, tile: destination });
        this.scene?.events.emit('unit-moved', { unit: otherUnit, tile: origin });

        const moveThis = this.animationEngine.moveToTile(this.sprite, destination, this.tileSize);
        const moveOther = this.animationEngine.moveToTile(otherUnit.sprite, origin, otherUnit.tileSize);
        return Promise.all([moveThis, moveOther]).then(() => true);
    }
}

