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
        const frontier = new PriorityQueue(fScore);

        const startKey = this.key(start);
        openSet.set(startKey, start);
        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(start, goal));
        frontier.push(startKey, start);

        while (openSet.size > 0) {
            const currentEntry = frontier.pop(openSet);
            if (!currentEntry) {
                break;
            }

            const { node: current, key: currentKey } = currentEntry;
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
                    frontier.push(neighborKey, neighbor);
                }
            }
        }

        return [];
    }

    getNeighbors(node) {
        return DIRECTIONS
            .map((dir) => ({ x: node.x + dir.x, y: node.y + dir.y }))
            .filter((neighbor) => this.inBounds(neighbor));
    }

    inBounds(tile) {
        return tile.x >= 0 && tile.x < this.dungeon.width && tile.y >= 0 && tile.y < this.dungeon.height;
    }

    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
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

const DIRECTIONS = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 }
];

class PriorityQueue {
    constructor(scoreMap) {
        this.scoreMap = scoreMap;
        this.items = [];
    }

    push(key, node) {
        const score = this.scoreMap.get(key) ?? Infinity;
        this.items.push({ key, node, score });
        this.bubbleUp(this.items.length - 1);
    }

    pop(openSet) {
        while (this.items.length > 0) {
            const top = this.items[0];
            const last = this.items.pop();
            if (this.items.length > 0) {
                this.items[0] = last;
                this.bubbleDown(0);
            }

            const currentScore = this.scoreMap.get(top.key);
            if (openSet?.has(top.key) && currentScore === top.score) {
                return top;
            }
        }
        return null;
    }

    bubbleUp(index) {
        while (index > 0) {
            const parent = Math.floor((index - 1) / 2);
            if (this.items[parent].score <= this.items[index].score) {
                break;
            }
            this.swap(index, parent);
            index = parent;
        }
    }

    bubbleDown(index) {
        const length = this.items.length;
        while (true) {
            let smallest = index;
            const left = 2 * index + 1;
            const right = 2 * index + 2;

            if (left < length && this.items[left].score < this.items[smallest].score) {
                smallest = left;
            }

            if (right < length && this.items[right].score < this.items[smallest].score) {
                smallest = right;
            }

            if (smallest === index) {
                break;
            }

            this.swap(index, smallest);
            index = smallest;
        }
    }

    swap(a, b) {
        [this.items[a], this.items[b]] = [this.items[b], this.items[a]];
    }
}

