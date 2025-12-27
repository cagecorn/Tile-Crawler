export class PartyAiManager {
    constructor({ pathfindingEngine, visionEngine, turnEngine, formationManager, movementManager }) {
        this.pathfindingEngine = pathfindingEngine;
        this.visionEngine = visionEngine;
        this.turnEngine = turnEngine;
        this.formationManager = formationManager;
        this.movementManager = movementManager;
    }

    updateDungeon(dungeon) {
        // PathfindingEngine and VisionEngine are usually updated externally (e.g. by Game.js),
        // but if PartyAiManager holds references dependent on dungeon, update them here.
        // Currently it delegates to engines, so nothing critical to do unless we cache dungeon.
    }

    determineAction(unit, player, monsters) {
        if (!unit || !unit.isAlive()) {
            return null;
        }

        const LEASH_DISTANCE = 6;
        const AGGRO_DISTANCE_FROM_PLAYER = 8;
        const distToPlayer = this.getDistance(unit.tilePosition, player.tilePosition);

        // 1. 치유가 필요한 아군 찾기 (메딕 전용 로직이 있다면 여기서 처리)
        // (스킬 AI 매니저가 따로 있다면 그쪽에서 처리하겠지만, 이동 우선순위를 정할 때 참고)

        // 2. 적이 사거리 내에 있는지 확인 (공격 가능하면 공격)
        const visibleMonsters = monsters.filter(m => this.visionEngine.lineOfSightClear(unit.tilePosition, m.tilePosition));
        const attackTarget = this.findBestAttackTarget(unit, visibleMonsters);
        
        if (attackTarget) {
            // 공격 범위 안에 적이 있다면 이동하지 않고 공격 (혹은 스킬 사용)
            // 여기서는 이동 AI만 다루므로, 공격을 위한 '이동'이 필요 없는 경우 null 반환
            // (실제 공격 액션은 TurnEngine이나 CombatEngine에서 처리됨)
            return null; 
        }

        // 3. 플레이어와 너무 멀어졌다면 강제로 복귀 (단, 적과 인접해있지 않다면)
        if (distToPlayer > LEASH_DISTANCE) {
            return this.followLeader(unit, player);
        }

        // 4. 적이 보이지만 사거리 밖이라면? -> 적에게 접근 (단, 플레이어 근처의 적만)
        if (visibleMonsters.length > 0) {
            // 플레이어 근처의 적만 필터링 (멀리 있는 적에게 돌진 방지)
            const engageableMonsters = visibleMonsters.filter(m => {
                const distPlayerToMonster = this.getDistance(player.tilePosition, m.tilePosition);
                return distPlayerToMonster <= AGGRO_DISTANCE_FROM_PLAYER;
            });

            const closestMonster = this.getClosestUnit(unit, engageableMonsters);
            if (closestMonster) {
                const approachPosition = this.findTacticalPosition(unit, closestMonster.tilePosition, unit.getAttackRange());
                if (approachPosition) {
                    return this.generateMoveAction(unit, approachPosition);
                }
            }
        }

        // 5. 전투 상황이 아니라면 -> 플레이어(대장) 따라가기
        return this.followLeader(unit, player);
    }

    followLeader(unit, leader) {
        const distance = this.getDistance(unit.tilePosition, leader.tilePosition);
        
        // 이미 대장 근처(거리 2 이하)에 있으면 굳이 움직이지 않음 (과도한 겹침 방지)
        if (distance <= 2) {
            return null;
        }

        // 대장의 위치가 아니라, 대장 '주변'의 빈 타일을 목표로 설정
        const targetTile = this.findEmptyTileNear(leader.tilePosition, unit.tilePosition);
        
        if (!targetTile) {
            return null; // 갈 곳이 없으면 대기
        }

        return this.generateMoveAction(unit, targetTile);
    }

    generateMoveAction(unit, targetPos) {
        // 경로 찾기
        const path = this.pathfindingEngine.findPath(unit.tilePosition, targetPos);
        
        // 경로가 없거나 너무 짧으면(제자리) 이동 안 함
        if (!path || path.length <= 1) {
            return null;
        }

        // 다음 한 칸만 이동 (턴제 게임이므로)
        const nextStep = path[1]; // path[0]은 현재 위치
        const dx = nextStep.x - unit.tilePosition.x;
        const dy = nextStep.y - unit.tilePosition.y;

        // 이동하려는 곳에 다른 유닛이 있는지 최종 확인
        if (this.turnEngine.getUnitAt(nextStep)) {
            return null; // 비켜줄 때까지 대기
        }

        return { type: 'move', dx, dy };
    }

    findEmptyTileNear(centerTile, myTile) {
        // 중심 타일(대장) 주변 8방향(또는 4방향) 검사
        const candidates = [
            { x: centerTile.x + 1, y: centerTile.y },
            { x: centerTile.x - 1, y: centerTile.y },
            { x: centerTile.x, y: centerTile.y + 1 },
            { x: centerTile.x, y: centerTile.y - 1 }
        ];

        // 1. 이동 가능한(벽이 아닌) 곳
        // 2. 다른 유닛이 없는 곳
        // 3. 나랑 가장 가까운 곳 순서로 정렬
        const validTiles = candidates.filter(tile => 
            this.pathfindingEngine.isWalkable(tile) && 
            !this.turnEngine.getUnitAt(tile)
        ).sort((a, b) => {
            const distA = this.getDistance(a, myTile);
            const distB = this.getDistance(b, myTile);
            return distA - distB;
        });

        return validTiles.length > 0 ? validTiles[0] : null;
    }

    findTacticalPosition(unit, targetPos, range) {
        // 적에게 다가갈 때도 무작정 적 위치로 돌진하지 않고 사거리 끝에 걸치도록 이동
        // (간단하게 구현: 적 주변 타일 중 내 사거리 안쪽이면서 가장 가까운 곳)
        // 지금은 단순히 적 방향으로 이동하도록 경로 탐색에 맡김
        return targetPos; 
    }

    findBestAttackTarget(unit, monsters) {
        const range = unit.getAttackRange();
        // 사거리 내에 있는 적 중 가장 약한(체력 낮은) 적 선호
        const targets = monsters.filter(m => this.getDistance(unit.tilePosition, m.tilePosition) <= range);
        return targets.sort((a, b) => a.currentHealth - b.currentHealth)[0];
    }

    getClosestUnit(sourceUnit, targetUnits) {
        let closest = null;
        let minTime = Infinity;

        // 단순히 거리만 보는 게 아니라 실제 경로 거리(Path Distance)를 보는 게 정확하지만,
        // 성능을 위해 맨해튼 거리로 근사 계산
        targetUnits.forEach(target => {
            const dist = this.getDistance(sourceUnit.tilePosition, target.tilePosition);
            if (dist < minTime) {
                minTime = dist;
                closest = target;
            }
        });
        return closest;
    }

    getDistance(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }
}
