import { Unit } from './Unit.js';

export class GunnerUnit extends Unit {
    constructor({ scene, startTile, tileSize, animationEngine, dungeon, specialEffectManager, shieldManager, turnEngine, movementManager, stats }) {
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
            textureKey: 'gunner',
            stats,
            faction: 'allies',
            name: '거너'
        });

        this.className = '거너';
        this.portrait = 'assets/images/unit-ui/gunner-ui.png';
        this.aiRole = 'ranged';
    }

    getPreferredEngagementRange() {
        const max = this.getAttackRange();
        const min = Math.max(2, max - 2);
        return { min, max };
    }
}
