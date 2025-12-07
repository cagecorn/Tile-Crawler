import { TileType } from '../dungeon/DungeonGenerator.js';

export class PartyFormationManager {
    constructor({ turnEngine, dungeon, tileSize, pathfindingEngine }) {
        this.turnEngine = turnEngine;
        this.dungeon = dungeon;
        this.tileSize = tileSize;
        this.pathfindingEngine = pathfindingEngine;
    }

    findSpawnTileNear(anchor, { minDistance = 1, maxDistance = 3 } = {}) {
        const candidates = this.collectRing(anchor, minDistance, maxDistance)
            .filter((tile) => this.isWalkable(tile))
            .filter((tile) => !this.turnEngine?.getUnitAt(tile));

        if (candidates.length === 0) {
            return { ...anchor };
        }

        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    findEscortTile(playerTile, { minDistance = 2, maxDistance = 4 } = {}) {
        const candidates = this.collectRing(playerTile, minDistance, maxDistance)
            .filter((tile) => this.isWalkable(tile))
            .filter((tile) => !this.turnEngine?.getUnitAt(tile));

        if (candidates.length === 0) {
            const fallbackRing = this.collectRing(playerTile, 1, Math.max(maxDistance + 1, minDistance + 1))
                .filter((tile) => this.isWalkable(tile))
                .filter((tile) => !this.turnEngine?.getUnitAt(tile));

            if (fallbackRing.length === 0) {
                if (this.isWalkable(playerTile) && !this.turnEngine?.getUnitAt(playerTile)) {
                    return { ...playerTile };
                }
                return null;
            }

            fallbackRing.sort((a, b) => this.manhattanDistance(playerTile, a) - this.manhattanDistance(playerTile, b));
            return fallbackRing[0];
        }

        candidates.sort((a, b) => this.manhattanDistance(playerTile, a) - this.manhattanDistance(playerTile, b));
        return candidates[0];
    }

    collectRing(origin, minDistance, maxDistance) {
        const tiles = [];
        for (let dx = -maxDistance; dx <= maxDistance; dx++) {
            for (let dy = -maxDistance; dy <= maxDistance; dy++) {
                const tile = { x: origin.x + dx, y: origin.y + dy };
                const distance = Math.abs(dx) + Math.abs(dy);
                if (distance >= minDistance && distance <= maxDistance) {
                    tiles.push(tile);
                }
            }
        }
        return tiles;
    }

    isWalkable(tile) {
        if (!tile) {
            return false;
        }
        const withinBounds = tile.x >= 0 && tile.x < this.dungeon.width && tile.y >= 0 && tile.y < this.dungeon.height;
        if (!withinBounds) {
            return false;
        }
        return this.dungeon.tiles[tile.y][tile.x] === TileType.FLOOR;
    }

    manhattanDistance(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }
}
