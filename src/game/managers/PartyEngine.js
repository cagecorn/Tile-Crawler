import { SentinelUnit } from '../units/Sentinel.js';

export class PartyEngine {
    constructor({
        scene,
        player,
        dungeon,
        tileSize,
        animationEngine,
        specialEffectManager,
        turnEngine,
        movementManager,
        formationManager,
        aiManager,
        classManager,
        statManager,
        logEngine,
        minimap,
        equipmentEngine
    }) {
        this.scene = scene;
        this.player = player;
        this.dungeon = dungeon;
        this.tileSize = tileSize;
        this.animationEngine = animationEngine;
        this.specialEffectManager = specialEffectManager;
        this.turnEngine = turnEngine;
        this.movementManager = movementManager;
        this.formationManager = formationManager;
        this.aiManager = aiManager;
        this.classManager = classManager;
        this.statManager = statManager;
        this.logEngine = logEngine;
        this.minimap = minimap;
        this.equipmentEngine = equipmentEngine;

        this.activeLimit = 6;
        this.reserveLimit = 2;
        this.activeMembers = [];
        this.reserveMembers = [];
        this.listeners = new Set();
    }

    onChange(listener) {
        if (listener) {
            this.listeners.add(listener);
        }
    }

    notifyChange() {
        this.listeners.forEach((listener) => listener?.());
    }

    planTurn(player, monsters) {
        if (!this.aiManager) {
            return;
        }
        this.aiManager.planTurn(this.activeMembers, player, monsters);
    }

    hireSentinel() {
        if (!this.player) {
            return null;
        }

        const spawnTile = this.formationManager?.findSpawnTileNear(this.player.tilePosition, { minDistance: 1, maxDistance: 3 }) ?? this.player.tilePosition;
        const stats = this.classManager?.createStatsForClass('sentinel') ?? this.statManager?.createStats({}) ?? {};

        const sentinel = new SentinelUnit({
            scene: this.scene,
            startTile: spawnTile,
            tileSize: this.tileSize,
            animationEngine: this.animationEngine,
            dungeon: this.dungeon,
            specialEffectManager: this.specialEffectManager,
            turnEngine: this.turnEngine,
            movementManager: this.movementManager,
            stats
        });

        const accepted = this.addMember(sentinel);
        if (accepted) {
            this.logEngine?.log('센티넬이 합류했습니다. 플레이어를 지킵니다.');
            this.notifyChange();
        } else {
            this.logEngine?.log('용병 자리가 부족합니다.');
            sentinel.handleDeath();
        }
        return accepted;
    }

    addMember(unit) {
        if (!unit) {
            return false;
        }

        unit.isMercenary = true;

        if (this.activeMembers.length < this.activeLimit) {
            this.activeMembers.push(unit);
        } else if (this.reserveMembers.length < this.reserveLimit) {
            this.reserveMembers.push(unit);
        } else {
            return false;
        }

        this.equipmentEngine?.registerUnit(unit);
        this.scene?.events.emit('unit-moved', { unit, tile: unit.tilePosition });
        this.notifyChange();
        return true;
    }

    getRoster() {
        return {
            active: this.activeMembers.slice(),
            reserve: this.reserveMembers.slice(),
            activeLimit: this.activeLimit,
            reserveLimit: this.reserveLimit
        };
    }

    getPartyOrder(includePlayer = true) {
        const units = [];
        if (includePlayer && this.player) {
            units.push(this.player);
        }
        return units.concat(this.activeMembers, this.reserveMembers);
    }
}
