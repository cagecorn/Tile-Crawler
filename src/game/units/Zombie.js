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
        this.skillHints = [
            {
                id: 'zombie-bite',
                name: '썩은 이빨',
                description: '느리지만 집요한 물어뜯기로 근접 피해를 줍니다.',
                effect: '연속 공격 시 감염 위험이 커집니다.',
                manaCost: 0,
                cooldown: 0,
                range: { min: 1, max: 1 },
                damageMultiplier: 1
            }
        ];
    }

    awaken() {
        this.awake = true;
    }

    isAwake() {
        return this.awake;
    }
}

