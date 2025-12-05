import { Unit } from './Unit.js';

export class SentinelUnit extends Unit {
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
            textureKey: 'sentinel',
            stats,
            faction: 'allies',
            name: '센티넬'
        });

        this.className = '센티넬';
        this.portrait = 'assets/images/unit-ui/sentinel-ui.png';
    }
}
