import { OrcArcherUnit } from '../units/OrcArcher.js';
import { OrcWarriorUnit } from '../units/OrcWarrior.js';
import { OrcWizardUnit } from '../units/OrcWizard.js';
import { MinotaurWarriorUnit } from '../units/MinotaurWarrior.js';
import { ZombieUnit } from '../units/Zombie.js';
import { MonsterBehaviorTree } from '../units/behaviors/MonsterBehaviorTree.js';

export class MonsterManager {
    constructor({
        scene,
        dungeon,
        tileSize,
        animationEngine,
        specialEffectManager,
        shieldManager,
        turnEngine,
        statManager,
        pathfindingEngine,
        visionEngine,
        movementManager,
        cursorTabManager = null,
        skillEngine = null
    }) {
        this.scene = scene;
        this.dungeon = dungeon;
        this.tileSize = tileSize;
        this.animationEngine = animationEngine;
        this.specialEffectManager = specialEffectManager;
        this.shieldManager = shieldManager;
        this.turnEngine = turnEngine;
        this.statManager = statManager;
        this.pathfindingEngine = pathfindingEngine;
        this.visionEngine = visionEngine;
        this.movementManager = movementManager;
        this.cursorTabManager = cursorTabManager;
        this.skillEngine = skillEngine;
        this.monsters = [];
        this.behaviorTree = new MonsterBehaviorTree(this.pathfindingEngine, this.visionEngine, this.turnEngine, this.skillEngine);
    }

    spawnMonsters() {
        const rooms = this.dungeon.rooms.slice(1);
        const spawnPlan = [
            { factory: () => this.createOrcWarrior(rooms), count: 4 },
            { factory: () => this.createOrcArcher(rooms), count: 3 },
            { factory: () => this.createOrcWizard(rooms), count: 3 },
            { factory: () => this.createMinotaurWarrior(rooms), count: 2 },
            { factory: () => this.createZombie(rooms), count: 4 }
        ];

        spawnPlan.forEach(({ factory, count }) => {
            for (let i = 0; i < count; i++) {
                const monster = factory();
                if (monster) {
                    this.registerMonster(monster);
                }
            }
        });
    }

    enableHoverTab(monster) {
        if (!this.cursorTabManager) {
            return;
        }
        this.cursorTabManager.attachMonsterHover(monster?.sprite, monster);
    }

    planTurn(player) {
        this.monsters = this.monsters.filter((monster) => monster.isAlive());
        this.monsters.forEach((monster) => {
            const action = this.behaviorTree.decide(monster, player);
            if (action) {
                this.turnEngine.queueAction(monster, action);
            }
        });
    }

    getMonsters() {
        return this.monsters.slice();
    }

    randomTileInRoom(room) {
        const x = Math.floor(room.x + 1 + Math.random() * Math.max(1, room.width - 2));
        const y = Math.floor(room.y + 1 + Math.random() * Math.max(1, room.height - 2));
        return { x, y };
    }

    registerMonster(monster) {
        this.monsters.push(monster);
        this.grantSignatureSkills(monster);
        this.enableHoverTab(monster);
    }

    pickSpawnTile(rooms) {
        if (rooms.length === 0) {
            return null;
        }
        const roomIndex = Math.floor(Math.random() * rooms.length);
        const room = rooms[roomIndex];
        let tile = this.randomTileInRoom(room);
        let attempts = 0;
        while (attempts < 8 && this.turnEngine.getUnitAt(tile)) {
            tile = this.randomTileInRoom(room);
            attempts++;
        }
        rooms.splice(roomIndex, 1);
        return tile;
    }

    createOrcWarrior(rooms) {
        const tile = this.pickSpawnTile(rooms);
        if (!tile) {
            return null;
        }
        const stats = this.statManager.createStats({
            health: 180,
            mana: 50,
            attack: 18,
            defense: 11,
            mobility: 3,
            actionSpeed: 8,
            sightRange: 8,
            attackRange: 1,
            healthRegen: 2,
            manaRegen: 1
        });

        return new OrcWarriorUnit({
            scene: this.scene,
            startTile: tile,
            tileSize: this.tileSize,
            animationEngine: this.animationEngine,
            dungeon: this.dungeon,
            specialEffectManager: this.specialEffectManager,
            shieldManager: this.shieldManager,
            turnEngine: this.turnEngine,
            movementManager: this.movementManager,
            stats
        });
    }

    createOrcArcher(rooms) {
        const tile = this.pickSpawnTile(rooms);
        if (!tile) {
            return null;
        }
        const stats = this.statManager.createStats({
            health: 130,
            mana: 70,
            attack: 16,
            defense: 7,
            mobility: 3,
            actionSpeed: 9,
            sightRange: 11,
            attackRange: 7,
            healthRegen: 1,
            manaRegen: 2
        });

        return new OrcArcherUnit({
            scene: this.scene,
            startTile: tile,
            tileSize: this.tileSize,
            animationEngine: this.animationEngine,
            dungeon: this.dungeon,
            specialEffectManager: this.specialEffectManager,
            shieldManager: this.shieldManager,
            turnEngine: this.turnEngine,
            movementManager: this.movementManager,
            stats
        });
    }

    createOrcWizard(rooms) {
        const tile = this.pickSpawnTile(rooms);
        if (!tile) {
            return null;
        }
        const stats = this.statManager.createStats({
            health: 120,
            mana: 90,
            attack: 10,
            magicAttack: 18,
            defense: 6,
            magicDefense: 12,
            mobility: 3,
            actionSpeed: 8,
            sightRange: 10,
            attackRange: 6,
            healthRegen: 1,
            manaRegen: 3
        });

        return new OrcWizardUnit({
            scene: this.scene,
            startTile: tile,
            tileSize: this.tileSize,
            animationEngine: this.animationEngine,
            dungeon: this.dungeon,
            specialEffectManager: this.specialEffectManager,
            shieldManager: this.shieldManager,
            turnEngine: this.turnEngine,
            movementManager: this.movementManager,
            stats
        });
    }

    createMinotaurWarrior(rooms) {
        const tile = this.pickSpawnTile(rooms);
        if (!tile) {
            return null;
        }
        const stats = this.statManager.createStats({
            health: 230,
            mana: 70,
            attack: 20,
            defense: 14,
            mobility: 3,
            actionSpeed: 7,
            sightRange: 9,
            attackRange: 1,
            healthRegen: 3,
            manaRegen: 2
        });

        return new MinotaurWarriorUnit({
            scene: this.scene,
            startTile: tile,
            tileSize: this.tileSize,
            animationEngine: this.animationEngine,
            dungeon: this.dungeon,
            specialEffectManager: this.specialEffectManager,
            shieldManager: this.shieldManager,
            turnEngine: this.turnEngine,
            movementManager: this.movementManager,
            stats
        });
    }

    createZombie(rooms) {
        const tile = this.pickSpawnTile(rooms);
        if (!tile) {
            return null;
        }
        const stats = this.statManager.createStats({
            health: 110,
            attack: 11,
            defense: 6,
            mobility: 3,
            actionSpeed: 7,
            sightRange: 9,
            attackRange: 1,
            healthRegen: 1,
            manaRegen: 0
        });

        const zombie = new ZombieUnit({
            scene: this.scene,
            startTile: tile,
            tileSize: this.tileSize,
            animationEngine: this.animationEngine,
            dungeon: this.dungeon,
            specialEffectManager: this.specialEffectManager,
            shieldManager: this.shieldManager,
            turnEngine: this.turnEngine,
            movementManager: this.movementManager,
            stats
        });
        zombie.behaviorProfile = 'shambler';
        return zombie;
    }

    grantSignatureSkills(monster) {
        if (!monster || !this.skillEngine) {
            return;
        }
        const signature = {
            '오크 전사': ['rending-strike'],
            '오크 궁수': ['snipe'],
            '오크 마법사': ['fireball'],
            '미노타우르스 전사': ['battle-cry']
        };
        const skills = signature[monster.name];
        if (!skills) {
            return;
        }
        skills.forEach((skillId) => this.skillEngine.grantSkillToUnit(monster, skillId));
    }
}

