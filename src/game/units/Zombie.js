import { Unit } from './Unit.js';

export class ZombieUnit extends Unit {
    constructor({ scene, startTile, tileSize, animationEngine, dungeon, specialEffectManager, turnEngine, stats }) {
        super({
            scene,
            startTile,
            tileSize,
            animationEngine,
            dungeon,
            specialEffectManager,
            turnEngine,
            textureKey: 'zombie',
            stats,
            faction: 'undead'
        });

        this.spawnAnchor = { ...startTile };
    }
}

