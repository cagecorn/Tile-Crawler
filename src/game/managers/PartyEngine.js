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

    async hireMercenary(className, textureKey) {
        // 이미 2명 이상이면 고용 불가 (예시 제한)
        if (this.partyMembers.length >= 2) {
            this.logEngine?.log('파티가 꽉 찼습니다.');
            return;
        }

        const MercenaryClass = await this.loadMercenaryClass(className);
        if (!MercenaryClass) {
            return;
        }

        // 플레이어 근처 빈 타일 찾기
        const spawnTile = this.findSpawnTileNearPlayer();
        if (!spawnTile) {
            this.logEngine?.log('용병을 소환할 공간이 부족합니다.');
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
            stats: this.classManager.getStatsForClass(className.toLowerCase()), // 간단히 클래스 매니저 활용
            faction: 'allies',
            name: `${className} 용병`
        });

        // 장비/스킬 초기화 등 추가 설정이 필요하면 여기서 수행
        this.equipmentEngine?.registerUnit(mercenary);
        
        this.partyMembers.push(mercenary);
        this.notifyChange();
        this.logEngine?.log(`${className} 용병을 고용했습니다!`);

        // 미니맵 갱신
        this.minimap?.updateAllyPosition(mercenary, spawnTile);
    }

    async loadMercenaryClass(className) {
        // 동적 임포트 혹은 매핑을 통해 클래스 가져오기
        // 여기서는 간단히 매핑으로 처리한다고 가정 (실제 프로젝트 구조에 맞춰 수정 필요)
        try {
            const module = await import(`../units/${className}.js`);
            // default export가 클래스라고 가정하거나, 클래스 이름으로 export 되었는지 확인
            return module.default || module[className];
        } catch (e) {
            console.error(`Failed to load unit class: ${className}`, e);
            return null;
        }
    }

    findSpawnTileNearPlayer() {
        const playerPos = this.player.tilePosition;
        const candidates = [
            { x: playerPos.x - 1, y: playerPos.y },
            { x: playerPos.x + 1, y: playerPos.y },
            { x: playerPos.x, y: playerPos.y - 1 },
            { x: playerPos.x, y: playerPos.y + 1 }
        ];

        for (const tile of candidates) {
            if (this.isWalkable(tile) && !this.turnEngine.getUnitAt(tile)) {
                return tile;
            }
        }
        return null;
    }

    isWalkable(tile) {
        // 간단한 벽 체크
        if (tile.x < 0 || tile.y < 0 || tile.x >= this.dungeon.width || tile.y >= this.dungeon.height) return false;
        return this.dungeon.tiles[tile.y][tile.x] === 1; // 1: FLOOR 가정 (TileType import 필요 시 추가)
    }

    planTurn(player, monsters) {
        // 파티원들의 행동 결정 및 예약
        this.partyMembers.forEach(member => {
            if (!member.isAlive()) return;

            // 1. 스킬 사용 시도
            const skillAction = this.skillAiManager?.decideAction(member, [player, ...this.partyMembers], monsters);
            if (skillAction) {
                this.turnEngine.queueAction(member, skillAction);
                return;
            }

            // 2. 이동/공격 결정 (PartyAiManager)
            // 수정된 부분: decide() -> determineAction()
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
