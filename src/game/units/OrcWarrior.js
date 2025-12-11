import { Unit } from './Unit.js';

export class OrcWarriorUnit extends Unit {
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
            textureKey: 'orc-warrior',
            stats,
            faction: 'horde',
            name: '오크 전사'
        });

        this.spawnAnchor = { ...startTile };
        this.behaviorProfile = 'melee';
        this.skillHints = [
            {
                id: 'rending-strike',
                name: '렌딩 스트라이크',
                description: '모은 [피] 자원 수치만큼 %의 확률로 출혈을 남기는 강렬한 참격.',
                effect: '근접 전투에서 장기전이 될수록 출혈 성공률이 올라갑니다.',
                manaCost: 7,
                cooldown: 2,
                range: { min: 1, max: 1 }
            }
        ];
    }
}
