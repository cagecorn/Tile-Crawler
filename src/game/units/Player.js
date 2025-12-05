import { Unit } from './Unit.js';

export class PlayerUnit extends Unit {
    constructor(scene, startTile, tileSize, animationEngine, dungeon, classManager, specialEffectManager, turnEngine) {
        const stats = classManager.createStatsForClass('warrior');
        super({
            scene,
            startTile,
            tileSize,
            animationEngine,
            dungeon,
            specialEffectManager,
            turnEngine,
            textureKey: 'player',
            stats,
            faction: 'allies',
            name: '플레이어'
        });
    }
}
