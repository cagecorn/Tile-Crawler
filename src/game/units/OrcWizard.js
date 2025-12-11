import { Unit } from './Unit.js';

export class OrcWizardUnit extends Unit {
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
            textureKey: 'orc-wizard',
            stats,
            faction: 'horde',
            name: '오크 마법사'
        });

        this.spawnAnchor = { ...startTile };
        this.behaviorProfile = 'caster';
        this.skillHints = [
            {
                id: 'fireball',
                name: '파이어볼',
                description: '수집한 [불] 자원만큼 화염을 증폭시켜, 멀리서 폭발을 일으킵니다.',
                effect: '불 자원이 높을수록 화끈한 마무리 가능.',
                manaCost: 12,
                cooldown: 2,
                range: { min: 2, max: 6 }
            }
        ];
    }
}
