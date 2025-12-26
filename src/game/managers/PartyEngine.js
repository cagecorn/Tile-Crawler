import { SentinelUnit } from '../units/Sentinel.js';
import { MedicUnit } from '../units/Medic.js';
import { GunnerUnit } from '../units/Gunner.js';
import { TileType } from '../dungeon/DungeonGenerator.js';

export class PartyEngine {
    constructor({ 
        scene, 
        player, 
        dungeon, 
        tileSize, 
        animationEngine, 
        specialEffectManager, 
        shieldManager, 
        turnEngine, 
        movementManager, 
        formationManager, 
        aiManager, 
        skillAiManager, 
        classManager, 
        statManager,
        logEngine,
        minimap,
        equipmentEngine,
        skillEngine
    }) {
        this.scene = scene;
        this.player = player;
        this.dungeon = dungeon;
        this.tileSize = tileSize;
        this.animationEngine = animationEngine;
        this.specialEffectManager = specialEffectManager;
        this.shieldManager = shieldManager;
        this.turnEngine = turnEngine;
        this.movementManager = movementManager;
        this.formationManager = formationManager;
        this.aiManager = aiManager;
        this.skillAiManager = skillAiManager;
        this.classManager = classManager;
        this.statManager = statManager;
        this.logEngine = logEngine;
        this.minimap = minimap;
        this.equipmentEngine = equipmentEngine;
        this.skillEngine = skillEngine;

        this.partyMembers = []; // 용병 목록
        this.changeListeners = [];
    }

    onChange(callback) {
        if (typeof callback === 'function') {
            this.changeListeners.push(callback);
        }
    }

    notifyChange() {
        this.changeListeners.forEach(cb => cb());
    }

    // 용병 고용 (예: Sentinel)
    hireSentinel() {
        this.hireMercenary('Sentinel', 'sentinel');
    }

    hireMedic() {
        this.hireMercenary('Medic', 'medic');
    }

    hireGunner() {
        this.hireMercenary('Gunner', 'gunner');
    }

    hireMercenary(className, textureKey) {
        // 이미 2명 이상이면 고용 불가
        if (this.partyMembers.length >= 2) {
            this.logEngine?.log('파티가 꽉 찼습니다.');
            return;
        }

        let MercenaryClass;
        switch (className) {
            case 'Sentinel':
                MercenaryClass = SentinelUnit;
                break;
            case 'Medic':
                MercenaryClass = MedicUnit;
                break;
            case 'Gunner':
                MercenaryClass = GunnerUnit;
                break;
            default:
                this.logEngine?.log(`시스템 오류: 알 수 없는 클래스 (${className})`);
                return;
        }

        // 플레이어 근처 빈 타일 찾기 (상세 로그 포함)
        const spawnTile = this.findSpawnTileNearPlayer();
        
        if (!spawnTile) {
            this.logEngine?.log('용병을 소환할 공간이 부족합니다. (주변에 빈 땅이 없습니다)');
            // 디버그용: 플레이어 위치 출력
            console.warn(`Spawn failed. Player at (${this.player.tilePosition.x}, ${this.player.tilePosition.y})`);
            return;
        }

        const mercenary = new MercenaryClass({
            scene: this.scene,
            startTile: spawnTile,
            tileSize: this.tileSize,
            animationEngine: this.animationEngine,
            dungeon: this.dungeon,
            specialEffectManager: this.specialEffectManager,
            shieldManager: this.shieldManager,
            turnEngine: this.turnEngine,
            movementManager: this.movementManager,
            textureKey: textureKey,
            stats: this.classManager.getStatsForClass(className.toLowerCase()),
            faction: 'allies',
            name: `${className} 용병`
        });

        this.equipmentEngine?.registerUnit(mercenary);
        
        this.partyMembers.push(mercenary);
        this.notifyChange();
        this.logEngine?.log(`${className} 용병을 고용했습니다!`);

        // 미니맵 갱신
        this.minimap?.updateAllyPosition(mercenary, spawnTile);
    }

    findSpawnTileNearPlayer() {
        const playerPos = this.player.tilePosition;
        
        // 검색 범위: 거리 1부터 2까지 순차적으로
        const offsets = [
            // 거리 1 (상하좌우)
            [0, 1], [0, -1], [1, 0], [-1, 0],
            // 거리 1 (대각선)
            [1, 1], [1, -1], [-1, 1], [-1, -1],
            // 거리 2 (상하좌우 확장)
            [0, 2], [0, -2], [2, 0], [-2, 0]
        ];

        for (const [dx, dy] of offsets) {
            const tile = { x: playerPos.x + dx, y: playerPos.y + dy };
            
            // 디버그: 각 타일 검사 결과 확인 (개발자 도구 콘솔에서 확인 가능)
            // console.log(`Checking tile (${tile.x}, ${tile.y})...`);

            if (this.isWalkable(tile)) {
                const occupant = this.turnEngine.getUnitAt(tile);
                if (!occupant) {
                    // console.log(`  -> Valid spawn point found!`);
                    return tile;
                } else {
                    // console.log(`  -> Occupied by ${occupant.getName()}`);
                }
            } else {
                // console.log(`  -> Not walkable (Wall or Void)`);
            }
        }
        return null;
    }

    isWalkable(tile) {
        // 1. 맵 밖인지 체크
        if (tile.x < 0 || tile.y < 0 || tile.x >= this.dungeon.width || tile.y >= this.dungeon.height) {
            return false;
        }
        
        const tileValue = this.dungeon.tiles[tile.y][tile.x];

        // 2. 바닥 체크 (매우 관대하게)
        // TileType.FLOOR(1) 이거나, 그냥 숫자 1이거나, 최소한 벽(2)이나 빈공간(0)만 아니면 통과
        const isFloor = (tileValue === TileType.FLOOR) || (tileValue === 1);
        
        // 만약 DungeonGenerator에서 바닥을 0으로 쓰고 있다면? (혹시 모를 예외 처리)
        // 보통 0=Empty, 1=Floor, 2=Wall 이지만, 반대일 경우를 대비해
        // "벽(2)이 아니다"라는 조건으로 체크하는 것도 방법입니다.
        // 여기서는 안전하게 1 또는 TileType.FLOOR만 허용합니다.

        return isFloor;
    }

    planTurn(player, monsters) {
        this.partyMembers.forEach(member => {
            if (!member.isAlive()) return;

            const skillAction = this.skillAiManager?.decideAction(member, [player, ...this.partyMembers], monsters);
            if (skillAction) {
                this.turnEngine.queueAction(member, skillAction);
                return;
            }

            const action = this.aiManager?.determineAction(member, player, monsters);
            if (action) {
                this.turnEngine.queueAction(member, action);
            }
        });
    }

    getPartyOrder(includePlayer = true) {
        if (includePlayer) {
            return [this.player, ...this.partyMembers];
        }
        return [...this.partyMembers];
    }
}
