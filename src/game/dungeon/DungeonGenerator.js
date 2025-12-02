import { measurementManager } from '../config/MeasurementManager';

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

    generate() {
        const { width, height } = this.measurements.getMapSize();
        const grid = Array.from({ length: height }, () => Array.from({ length: width }, () => TILE_WALL));
        const rooms = this.createRooms(grid);
        this.connectRooms(grid, rooms);

        return {
            tiles: grid,
            rooms,
            width,
            height
        };
    }

    createRooms(grid) {
        const rooms = [];
        const roomConfig = this.measurements.getRoomConfig();

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
        const bonusEdges = graphEdges.filter(() => Math.random() < 0.15);

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

    carveCorridor(grid, roomA, roomB) {
        const corridorWidth = this.measurements.getCorridorWidth();
        const halfWidth = Math.floor(corridorWidth / 2);
        const centerA = this.roomCenter(roomA);
        const centerB = this.roomCenter(roomB);
        const horizontalFirst = Math.random() > 0.5;

        if (horizontalFirst) {
            this.fillArea(grid, Math.min(centerA.x, centerB.x), centerA.y - halfWidth, Math.abs(centerA.x - centerB.x) + 1, corridorWidth, TILE_FLOOR);
            this.fillArea(grid, centerB.x - halfWidth, Math.min(centerA.y, centerB.y), corridorWidth, Math.abs(centerA.y - centerB.y) + 1, TILE_FLOOR);
        } else {
            this.fillArea(grid, centerA.x - halfWidth, Math.min(centerA.y, centerB.y), corridorWidth, Math.abs(centerA.y - centerB.y) + 1, TILE_FLOOR);
            this.fillArea(grid, Math.min(centerA.x, centerB.x), centerB.y - halfWidth, Math.abs(centerA.x - centerB.x) + 1, corridorWidth, TILE_FLOOR);
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
}

export const TileType = {
    WALL: TILE_WALL,
    FLOOR: TILE_FLOOR
};
