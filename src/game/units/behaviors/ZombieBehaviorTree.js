import { TileType } from '../../dungeon/DungeonGenerator.js';

export class ZombieBehaviorTree {
    constructor(pathfindingEngine, visionEngine, turnEngine) {
        this.pathfindingEngine = pathfindingEngine;
        this.visionEngine = visionEngine;
        this.turnEngine = turnEngine;
    }

    decide(zombie, player) {
        if (!zombie.isAlive()) {
            return null;
        }

        const nodes = [
            () => this.approachPlayerNode(zombie, player),
            () => this.wanderAroundSpawn(zombie)
        ];

        for (const node of nodes) {
            const action = node();
            if (action) {
                return action;
            }
        }

        return null;
    }

    approachPlayerNode(zombie, player) {
        const sightRange = zombie.getSightRange();
        if (!this.visionEngine.canSee(zombie.tilePosition, player.tilePosition, sightRange)) {
            return null;
        }

        const path = this.pathfindingEngine.findPath(zombie.tilePosition, player.tilePosition);
        if (path.length <= 1) {
            return null;
        }

        const nextStep = path[1];
        const dx = nextStep.x - zombie.tilePosition.x;
        const dy = nextStep.y - zombie.tilePosition.y;
        return { type: 'move', dx, dy };
    }

    wanderAroundSpawn(zombie) {
        const driftRadius = 4;
        const candidateTiles = this.shuffledNeighbors(zombie.tilePosition)
            .filter((tile) => this.withinAnchor(tile, zombie.spawnAnchor, driftRadius))
            .filter((tile) => this.isWalkable(tile));

        if (candidateTiles.length === 0) {
            return null;
        }

        const target = candidateTiles[0];
        const dx = target.x - zombie.tilePosition.x;
        const dy = target.y - zombie.tilePosition.y;
        return { type: 'move', dx, dy };
    }

    shuffledNeighbors(origin) {
        const neighbors = [
            { x: origin.x + 1, y: origin.y },
            { x: origin.x - 1, y: origin.y },
            { x: origin.x, y: origin.y + 1 },
            { x: origin.x, y: origin.y - 1 }
        ];

        for (let i = neighbors.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [neighbors[i], neighbors[j]] = [neighbors[j], neighbors[i]];
        }
        return neighbors;
    }

    withinAnchor(tile, anchor, radius) {
        return Math.abs(tile.x - anchor.x) + Math.abs(tile.y - anchor.y) <= radius;
    }

    isWalkable(tile) {
        const withinBounds = tile.x >= 0 && tile.x < this.pathfindingEngine.dungeon.width && tile.y >= 0 && tile.y < this.pathfindingEngine.dungeon.height;
        if (!withinBounds) {
            return false;
        }
        const cell = this.pathfindingEngine.dungeon.tiles[tile.y][tile.x];
        if (cell !== TileType.FLOOR) {
            return false;
        }
        const occupant = this.turnEngine.getUnitAt(tile);
        return !occupant;
    }
}

