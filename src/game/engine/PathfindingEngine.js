import { TileType } from '../dungeon/DungeonGenerator.js';

export class PathfindingEngine {
    constructor(dungeon, turnEngine) {
        this.dungeon = dungeon;
        this.turnEngine = turnEngine;
    }

    findPath(start, goal) {
        const openSet = new Map();
        const closedSet = new Set();
        const gScore = new Map();
        const fScore = new Map();
        const cameFrom = new Map();

        const startKey = this.key(start);
        openSet.set(startKey, start);
        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(start, goal));

        while (openSet.size > 0) {
            const current = this.lowestFScore(openSet, fScore);
            const currentKey = this.key(current);

            if (current.x === goal.x && current.y === goal.y) {
                return this.reconstructPath(cameFrom, current);
            }

            openSet.delete(currentKey);
            closedSet.add(currentKey);

            for (const neighbor of this.getNeighbors(current)) {
                const neighborKey = this.key(neighbor);
                if (closedSet.has(neighborKey)) {
                    continue;
                }

                const tentativeG = (gScore.get(currentKey) ?? Infinity) + 1;
                const occupant = this.turnEngine?.getUnitAt(neighbor);
                if (occupant && neighborKey !== this.key(goal)) {
                    continue;
                }

                const isWall = this.dungeon.tiles[neighbor.y]?.[neighbor.x] !== TileType.FLOOR;
                if (isWall) {
                    continue;
                }

                if (!openSet.has(neighborKey) || tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
                    cameFrom.set(neighborKey, current);
                    gScore.set(neighborKey, tentativeG);
                    fScore.set(neighborKey, tentativeG + this.heuristic(neighbor, goal));
                    openSet.set(neighborKey, neighbor);
                }
            }
        }

        return [];
    }

    getNeighbors(node) {
        const directions = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];

        return directions
            .map((dir) => ({ x: node.x + dir.x, y: node.y + dir.y }))
            .filter((neighbor) => this.inBounds(neighbor));
    }

    inBounds(tile) {
        return tile.x >= 0 && tile.x < this.dungeon.width && tile.y >= 0 && tile.y < this.dungeon.height;
    }

    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    lowestFScore(openSet, fScore) {
        let lowest = null;
        let lowestScore = Infinity;
        openSet.forEach((node, key) => {
            const score = fScore.get(key) ?? Infinity;
            if (score < lowestScore) {
                lowest = node;
                lowestScore = score;
            }
        });
        return lowest;
    }

    reconstructPath(cameFrom, current) {
        const totalPath = [current];
        let currentKey = this.key(current);
        while (cameFrom.has(currentKey)) {
            const previous = cameFrom.get(currentKey);
            currentKey = this.key(previous);
            totalPath.unshift(previous);
        }
        return totalPath;
    }

    key(tile) {
        return `${tile.x},${tile.y}`;
    }
}

