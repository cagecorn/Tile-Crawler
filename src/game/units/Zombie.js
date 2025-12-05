import { Unit } from './Unit.js';

export class ZombieUnit extends Unit {
    constructor({ scene, startTile, tileSize, animationEngine, dungeon, specialEffectManager, turnEngine, movementManager, stats }) {
        super({
            scene,
            startTile,
            tileSize,
            animationEngine,
                dungeon,
                specialEffectManager,
                turnEngine,
                movementManager,
                textureKey: 'zombie',
                stats,
                faction: 'undead',
                name: '좀비'
            });

        this.spawnAnchor = { ...startTile };
        this.awake = false;
    }

    awaken() {
        this.awake = true;
    }

    isAwake() {
        return this.awake;
    }
}

