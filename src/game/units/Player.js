import { Unit } from './Unit.js';

export class PlayerUnit extends Unit {
    constructor(scene, startTile, tileSize, animationEngine, dungeon, classManager, specialEffectManager, shieldManager, turnEngine, movementManager) {
        const stats = classManager.createStatsForClass('warrior');
        super({
            scene,
            startTile,
            tileSize,
            animationEngine,
            dungeon,
            specialEffectManager,
            shieldManager,
            turnEngine,
            movementManager,
            textureKey: 'player',
            stats,
            faction: 'allies',
            name: '플레이어'
        });

        this.isPlayer = true;
    }

    canSwapWith(otherUnit) {
        if (!otherUnit || otherUnit === this) {
            return false;
        }

        return otherUnit.faction === this.faction && Boolean(otherUnit.isMercenary);
    }
}
