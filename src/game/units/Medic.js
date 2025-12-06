import { Unit } from './Unit.js';

export class MedicUnit extends Unit {
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
            textureKey: 'medic',
            stats,
            faction: 'allies',
            name: '메딕'
        });

        this.className = '메딕';
        this.portrait = 'assets/images/unit-ui/medic-ui.png';
        this.aiRole = 'medic';
    }

    getPreferredHealRange() {
        return { min: 2, max: 5 };
    }
}
