import { measurementManager } from '../config/MeasurementManager.js';

const TILE_WALL = 'wall';
const TILE_FLOOR = 'floor';

function randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rectanglesOverlap(a, b, padding) {
    return (
        a.x - padding < b.x + b.width &&
        a.x + a.width + padding > b.x &&
        a.y - padding < b.y + b.height &&
        a.y + a.height + padding > b.y
    );
}

export class DungeonGenerator {
    constructor(units = measurementManager) {
        this.measurements = units;
    }

    generate(config = {}) {
        const width = config.width ?? this.measurements.getMapSize().width;
        const height = config.height ?? this.measurements.getMapSize().height;
        const grid = Array.from({ length: height }, () => Array.from({ length: width }, () => TILE_WALL));
        const rooms = this.createRooms(grid, config.roomConfig);
        this.connectRooms(grid, rooms, config.corridorWidth);
        this.addWanderingTunnels(grid, config.corridorWidth);
        this.placeStairs(grid, rooms);

        return {
            tiles: grid,
            rooms,
            width,
            height,
            config // Store config for reference (e.g. biomes)
        };
    }

    createRooms(grid, overrideRoomConfig) {
        const rooms = [];
        const roomConfig = overrideRoomConfig ?? this.measurements.getRoomConfig();

        for (let i = 0; i < roomConfig.maxRooms; i++) {
            const roomWidth = randomInRange(roomConfig.minWidth, roomConfig.maxWidth);
            const roomHeight = randomInRange(roomConfig.minHeight, roomConfig.maxHeight);
            const maxX = grid[0].length - roomWidth - 1;
            const maxY = grid.length - roomHeight - 1;

            if (maxX <= 1 || maxY <= 1) {
                break;
            }

            const x = randomInRange(1, Math.max(1, maxX));
            const y = randomInRange(1, Math.max(1, maxY));
            const newRoom = { x, y, width: roomWidth, height: roomHeight };

            const overlaps = rooms.some((room) => rectanglesOverlap(newRoom, room, roomConfig.padding));
            if (overlaps) {
                continue;
            }

            this.carveRoom(grid, newRoom);
            rooms.push(newRoom);
        }

        return rooms;
    }

    connectRooms(grid, rooms) {
        if (rooms.length === 0) {
            return;
        }

        const graphEdges = this.buildCompleteGraph(rooms);
        const mst = this.primMST(graphEdges, rooms.length);
        const bonusEdges = graphEdges.filter(() => Math.random() < 0.3);

        [...mst, ...bonusEdges].forEach((edge) => {
            const roomA = rooms[edge[0]];
            const roomB = rooms[edge[1]];
            this.carveCorridor(grid, roomA, roomB);
        });
    }

    buildCompleteGraph(rooms) {
        const edges = [];
        for (let i = 0; i < rooms.length; i++) {
            for (let j = i + 1; j < rooms.length; j++) {
                const distance = this.centerDistance(rooms[i], rooms[j]);
                edges.push([i, j, distance]);
            }
        }
        return edges.sort((a, b) => a[2] - b[2]);
    }

    primMST(edges, nodeCount) {
        const connected = new Set([0]);
        const mst = [];

        while (connected.size < nodeCount) {
            const edge = edges.find(([a, b]) => connected.has(a) !== connected.has(b));
            if (!edge) {
                break;
            }
            mst.push(edge);
            connected.add(edge[0]);
            connected.add(edge[1]);
        }

        return mst;
    }

    centerDistance(roomA, roomB) {
        const a = this.roomCenter(roomA);
        const b = this.roomCenter(roomB);
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    roomCenter(room) {
        return {
            x: Math.floor(room.x + room.width / 2),
            y: Math.floor(room.y + room.height / 2)
        };
    }

    carveRoom(grid, room) {
        this.fillArea(grid, room.x, room.y, room.width, room.height, TILE_FLOOR);
    }

    connectRooms(grid, rooms, corridorWidthOverride) {
        if (rooms.length === 0) {
            return;
        }

        const graphEdges = this.buildCompleteGraph(rooms);
        const mst = this.primMST(graphEdges, rooms.length);
        const bonusEdges = graphEdges.filter(() => Math.random() < 0.3);

        [...mst, ...bonusEdges].forEach((edge) => {
            const roomA = rooms[edge[0]];
            const roomB = rooms[edge[1]];
            this.carveCorridor(grid, roomA, roomB, corridorWidthOverride);
        });
    }

    carveCorridor(grid, roomA, roomB, corridorWidthOverride) {
        const corridorWidth = corridorWidthOverride ?? this.measurements.getCorridorWidth();
        const centerA = this.roomCenter(roomA);
        const centerB = this.roomCenter(roomB);
        const horizontalFirst = Math.random() > 0.5;

        const pathPoints = this.buildCorridorPath(centerA, centerB, horizontalFirst);

        for (let i = 0; i < pathPoints.length - 1; i++) {
            this.carveSegment(grid, pathPoints[i], pathPoints[i + 1], corridorWidth);
        }
    }

    buildCorridorPath(centerA, centerB, horizontalFirst) {
        const bendVariance = 6;
        const path = [centerA];

        if (horizontalFirst) {
            const midX = Math.floor((centerA.x + centerB.x) / 2 + randomInRange(-bendVariance, bendVariance));
            const offsetY = Math.floor((centerA.y + centerB.y) / 2 + randomInRange(-bendVariance, bendVariance / 2));
            path.push({ x: midX, y: centerA.y });
            path.push({ x: midX, y: offsetY });
            path.push({ x: centerB.x, y: offsetY });
        } else {
            const midY = Math.floor((centerA.y + centerB.y) / 2 + randomInRange(-bendVariance, bendVariance));
            const offsetX = Math.floor((centerA.x + centerB.x) / 2 + randomInRange(-bendVariance, bendVariance / 2));
            path.push({ x: centerA.x, y: midY });
            path.push({ x: offsetX, y: midY });
            path.push({ x: offsetX, y: centerB.y });
        }

        path.push(centerB);
        return path;
    }

    carveSegment(grid, start, end, corridorWidth) {
        const halfWidth = Math.floor(corridorWidth / 2);
        if (start.x === end.x) {
            // vertical
            const height = Math.abs(end.y - start.y) + 1;
            this.fillArea(grid, start.x - halfWidth, Math.min(start.y, end.y), corridorWidth, height, TILE_FLOOR);
        } else {
            // horizontal
            const width = Math.abs(end.x - start.x) + 1;
            this.fillArea(grid, Math.min(start.x, end.x), start.y - halfWidth, width, corridorWidth, TILE_FLOOR);
        }
    }

    fillArea(grid, startX, startY, width, height, value) {
        const maxY = grid.length;
        const maxX = grid[0].length;

        for (let y = startY; y < startY + height; y++) {
            if (y < 0 || y >= maxY) {
                continue;
            }
            for (let x = startX; x < startX + width; x++) {
                if (x < 0 || x >= maxX) {
                    continue;
                }
                grid[y][x] = value;
            }
        }
    }

    addWanderingTunnels(grid, corridorWidthOverride) {
        const spurCount = 12;
        const width = corridorWidthOverride ?? this.measurements.getCorridorWidth();
        for (let i = 0; i < spurCount; i++) {
            const start = this.randomFloorCell(grid);
            if (!start) {
                continue;
            }

            const steps = randomInRange(4, 10);
            let current = start;

            for (let step = 0; step < steps; step++) {
                const direction = this.randomDirection();
                const next = { x: current.x + direction.x * randomInRange(2, 4), y: current.y + direction.y * randomInRange(2, 4) };
                this.carveSegment(grid, current, next, width);
                current = next;
            }
        }
    }

    placeStairs(grid, rooms) {
        if (rooms.length < 2) {
            return;
        }
        // Spawn is usually at rooms[0], so we pick the furthest room or just a random one from the rest
        // Simple approach: pick random from remaining rooms
        const roomIndex = randomInRange(1, rooms.length - 1);
        const room = rooms[roomIndex];
        const center = this.roomCenter(room);
        grid[center.y][center.x] = TileType.STAIRS_DOWN;
    }

    randomDirection() {
        const directions = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];
        return directions[Math.floor(Math.random() * directions.length)];
    }

    randomFloorCell(grid) {
        const attempts = 40;
        for (let i = 0; i < attempts; i++) {
            const x = randomInRange(1, grid[0].length - 2);
            const y = randomInRange(1, grid.length - 2);
            if (grid[y][x] === TILE_FLOOR) {
                return { x, y };
            }
        }
        return null;
    }
}

export const TileType = {
    WALL: TILE_WALL,
    FLOOR: TILE_FLOOR,
    STAIRS_DOWN: 'stairs_down'
};
