import { Unit } from './Unit.js';

export class MinotaurWarriorUnit extends Unit {
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
            textureKey: 'minotaur-warrior',
            stats,
            faction: 'horde',
            name: '미노타우르스 전사'
        });

        this.spawnAnchor = { ...startTile };
        this.behaviorProfile = 'warden';
        this.skillHints = [
            {
                id: 'battle-cry',
                name: '배틀 크라이',
                description: '시야에 적이 포착되는 즉시 포효해 사기를 올립니다. 최대 2회까지 중첩.',
                effect: '조우 직후 광역 버프로 전투를 시작합니다.',
                manaCost: 14,
                cooldown: 5,
                range: { min: 0, max: 3 }
            }
        ];
    }
}
