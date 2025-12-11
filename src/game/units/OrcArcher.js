import { Unit } from './Unit.js';

export class OrcArcherUnit extends Unit {
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
            textureKey: 'orc-archer',
            stats,
            faction: 'horde',
            name: '오크 궁수'
        });

        this.spawnAnchor = { ...startTile };
        this.behaviorProfile = 'skirmisher';
        this.skillHints = [
            {
                id: 'snipe',
                name: '저격',
                description: '멀리서 급소를 노려 강한 일격을 가합니다.',
                effect: '시야만 확보되면 사거리 끝에서도 강타를 꽂아 넣습니다.',
                manaCost: 10,
                cooldown: 3,
                range: { min: 3, max: 8 }
            }
        ];
    }
}
