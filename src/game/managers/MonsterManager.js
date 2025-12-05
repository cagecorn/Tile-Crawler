import { ZombieUnit } from '../units/Zombie.js';
import { ZombieBehaviorTree } from '../units/behaviors/ZombieBehaviorTree.js';

export class MonsterManager {
    constructor({
        scene,
        dungeon,
        tileSize,
        animationEngine,
        specialEffectManager,
        turnEngine,
        statManager,
        pathfindingEngine,
        visionEngine,
        movementManager
    }) {
        this.scene = scene;
        this.dungeon = dungeon;
        this.tileSize = tileSize;
        this.animationEngine = animationEngine;
        this.specialEffectManager = specialEffectManager;
        this.turnEngine = turnEngine;
        this.statManager = statManager;
        this.pathfindingEngine = pathfindingEngine;
        this.visionEngine = visionEngine;
        this.movementManager = movementManager;
        this.zombies = [];
        this.behaviorTree = new ZombieBehaviorTree(this.pathfindingEngine, this.visionEngine, this.turnEngine);
    }

    spawnZombies() {
        const rooms = this.dungeon.rooms.slice(1);
        const spawnCount = Math.max(8, Math.min(16, Math.floor((rooms.length * 3) / 4)));

        for (let i = 0; i < spawnCount; i++) {
            if (rooms.length === 0) {
                break;
            }

            const roomIndex = Math.floor(Math.random() * rooms.length);
            const room = rooms[roomIndex];
            let tile = this.randomTileInRoom(room);
            let attempts = 0;
            while (attempts < 8 && this.turnEngine.getUnitAt(tile)) {
                tile = this.randomTileInRoom(room);
                attempts++;
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
                turnEngine: this.turnEngine,
                movementManager: this.movementManager,
                stats
            });

            this.zombies.push(zombie);
            rooms.splice(roomIndex, 1);
        }
    }

    planTurn(player) {
        this.zombies = this.zombies.filter((zombie) => zombie.isAlive());
        this.zombies.forEach((zombie) => {
            const action = this.behaviorTree.decide(zombie, player);
            if (action) {
                this.turnEngine.queueAction(zombie, action);
            }
        });
    }

    getMonsters() {
        return this.zombies.slice();
    }

    randomTileInRoom(room) {
        const x = Math.floor(room.x + 1 + Math.random() * Math.max(1, room.width - 2));
        const y = Math.floor(room.y + 1 + Math.random() * Math.max(1, room.height - 2));
        return { x, y };
    }
}

