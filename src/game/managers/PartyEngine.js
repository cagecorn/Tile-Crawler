import { MedicUnit } from '../units/Medic.js';
import { SentinelUnit } from '../units/Sentinel.js';
import { GunnerUnit } from '../units/Gunner.js';

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
        this.turnEngine = turnEngine;

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
        const living = this.activeMembers.filter((member) => member?.isAlive?.());
        const allies = [player, ...living].filter(Boolean);
        this.skillAiManager?.beginTurn?.();
        living.forEach((member) => {
            const skillAction = this.skillAiManager?.decide(member, monsters, { allies });
            if (skillAction) {
                this.turnEngine?.queueAction(member, skillAction);
                return;
            }

            const action = this.aiManager?.decide(member, player, monsters, allies);
            if (action) {
                this.turnEngine?.queueAction(member, action);
            }
        });
    }

    hireSentinel() {
        if (!this.player) {
            return null;
        }

        const spawnTile = this.formationManager?.findSpawnTileNear(this.player.tilePosition, { minDistance: 1, maxDistance: 3 });
        if (!spawnTile) {
            this.logEngine?.log('용병을 배치할 안전한 공간을 찾지 못했습니다.');
            return null;
        }
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

        this.assignRandomSkills(sentinel, 'charge');

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

    hireMedic() {
        if (!this.player) {
            return null;
        }

        const spawnTile = this.formationManager?.findSpawnTileNear(this.player.tilePosition, { minDistance: 1, maxDistance: 3 });
        if (!spawnTile) {
            this.logEngine?.log('용병을 배치할 안전한 공간을 찾지 못했습니다.');
            return null;
        }
        const stats = this.classManager?.createStatsForClass('medic') ?? this.statManager?.createStats({}) ?? {};

        const medic = new MedicUnit({
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

        this.assignRandomSkills(medic, 'heal');

        const accepted = this.addMember(medic);
        if (accepted) {
            this.logEngine?.log('메딕이 합류했습니다. 후방에서 회복을 지원합니다.');
            this.notifyChange();
        } else {
            this.logEngine?.log('용병 자리가 부족합니다.');
            medic.handleDeath();
        }
        return accepted;
    }

    hireGunner() {
        if (!this.player) {
            return null;
        }

        const spawnTile = this.formationManager?.findSpawnTileNear(this.player.tilePosition, { minDistance: 2, maxDistance: 4 });
        if (!spawnTile) {
            this.logEngine?.log('용병을 배치할 안전한 공간을 찾지 못했습니다.');
            return null;
        }
        const stats = this.classManager?.createStatsForClass('gunner') ?? this.statManager?.createStats({}) ?? {};

        const gunner = new GunnerUnit({
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

        this.assignRandomSkills(gunner, 'snipe');

        const accepted = this.addMember(gunner);
        if (accepted) {
            this.logEngine?.log('거너가 합류했습니다. 멀찍이서 엄호 사격을 준비합니다.');
            this.notifyChange();
        } else {
            this.logEngine?.log('용병 자리가 부족합니다.');
            gunner.handleDeath();
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

    assignRandomSkills(unit, preferredSkillId = null) {
        if (!this.skillEngine || !unit) {
            return;
        }

        const granted = new Set();
        const available = this.skillEngine.getActiveSkills().map((skill) => skill.id);

        if (preferredSkillId) {
            this.skillEngine.grantSkillToUnit(unit, preferredSkillId);
            granted.add(preferredSkillId);
        }

        const maxAttempts = Math.max(available.length * 2, 2);
        let attempts = 0;
        while (granted.size < 2 && attempts < maxAttempts && available.length > 0) {
            const pick = available[Math.floor(Math.random() * available.length)];
            if (this.skillEngine.grantSkillToUnit(unit, pick)) {
                granted.add(pick);
            }
            attempts++;
        }

        if (granted.size < 2 && available.length > 0) {
            const fallback = available.find((skillId) => !granted.has(skillId)) ?? available[0];
            if (fallback) {
                this.skillEngine.grantSkillToUnit(unit, fallback);
            }
        }
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
