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

        if (candidates.length > 0) {
            return candidates[Math.floor(Math.random() * candidates.length)];
        }

        const extendedRadius = Math.max(maxDistance + 2, minDistance + 2);
        const fallbackRing = this.collectRing(anchor, 1, extendedRadius)
            .filter((tile) => this.isWalkable(tile))
            .filter((tile) => !this.turnEngine?.getUnitAt(tile));

        if (fallbackRing.length > 0) {
            fallbackRing.sort((a, b) => this.manhattanDistance(anchor, a) - this.manhattanDistance(anchor, b));
            return fallbackRing[0];
        }

        if (this.isWalkable(anchor) && !this.turnEngine?.getUnitAt(anchor)) {
            return { ...anchor };
        }

        return null;
    }

    findEscortTile(playerTile, { minDistance = 2, maxDistance = 4, avoidTiles = [] } = {}) {
        const isExcluded = (tile) => avoidTiles.some((excluded) => excluded?.x === tile.x && excluded?.y === tile.y);

        const candidates = this.collectRing(playerTile, minDistance, maxDistance)
            .filter((tile) => this.isWalkable(tile))
            .filter((tile) => !this.turnEngine?.getUnitAt(tile))
            .filter((tile) => !isExcluded(tile));

        if (candidates.length === 0) {
            const fallbackRing = this.collectRing(playerTile, 1, Math.max(maxDistance + 1, minDistance + 1))
                .filter((tile) => this.isWalkable(tile))
                .filter((tile) => !this.turnEngine?.getUnitAt(tile))
                .filter((tile) => !isExcluded(tile));

            if (fallbackRing.length === 0) {
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
