import { TileType } from '../dungeon/DungeonGenerator.js';

export class VisionEngine {
    constructor(dungeon) {
        this.dungeon = dungeon;
    }

    setDungeon(dungeon) {
        this.dungeon = dungeon;
    }

    canSee(source, target, range) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > range) {
            return false;
        }

        return this.lineOfSightClear(source, target);
    }

    lineOfSightClear(start, end) {
        const points = this.bresenhamLine(start, end);
        for (const point of points) {
            if (this.isBlockingTile(point)) {
                return false;
            }
        }
        return true;
    }

    bresenhamLine(start, end) {
        const points = [];
        let x0 = start.x;
        let y0 = start.y;
        const x1 = end.x;
        const y1 = end.y;

        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let error = dx - dy;

        while (!(x0 === x1 && y0 === y1)) {
            if (!(x0 === start.x && y0 === start.y)) {
                points.push({ x: x0, y: y0 });
            }

            const e2 = 2 * error;
            if (e2 > -dy) {
                error -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                error += dx;
                y0 += sy;
            }
        }

        return points;
    }

    isBlockingTile(point) {
        const withinBounds = point.x >= 0 && point.x < this.dungeon.width && point.y >= 0 && point.y < this.dungeon.height;
        if (!withinBounds) {
            return true;
        }
        // Stairs are not blocking
        const tile = this.dungeon.tiles[point.y][point.x];
        return tile !== TileType.FLOOR && tile !== TileType.STAIRS_DOWN;
    }
}

