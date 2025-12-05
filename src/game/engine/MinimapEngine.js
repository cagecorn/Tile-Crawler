import { TileType } from '../dungeon/DungeonGenerator.js';

export class MinimapEngine {
    constructor({ scene, dungeon, label = 'FLOOR 1', maxSize = 220, padding = 12, position } = {}) {
        this.scene = scene;
        this.dungeon = dungeon;
        this.maxSize = maxSize;
        this.padding = padding;
        this.scale = this.calculateScale();
        this.mapWidth = dungeon.width * this.scale;
        this.mapHeight = dungeon.height * this.scale;
        this.lastTile = null;

        const anchor = position ?? this.getDefaultPosition();
        this.container = this.scene.add.container(anchor.x, anchor.y);
        this.container.setScrollFactor(0);
        this.container.setDepth(80);
        this.container.setAlpha(0.94);

        this.createFrame(label);
        this.drawTiles();
        this.createPlayerIndicator();
    }

    calculateScale() {
        const usableWidth = this.maxSize - this.padding * 2;
        const usableHeight = this.maxSize - this.padding * 2;
        const widthScale = usableWidth / this.dungeon.width;
        const heightScale = usableHeight / this.dungeon.height;

        return Math.min(widthScale, heightScale);
    }

    getDefaultPosition() {
        const { width, height } = this.scene.scale;
        const totalWidth = this.mapWidth + this.padding * 2;
        return {
            x: totalWidth * 0.6,
            y: height / 2
        };
    }

    createFrame(label) {
        const frameWidth = this.mapWidth + this.padding * 2;
        const frameHeight = this.mapHeight + this.padding * 2 + 18;

        const frame = this.scene.add.graphics();
        frame.fillStyle(0x0d1420, 0.92);
        frame.fillRoundedRect(-frameWidth / 2, -frameHeight / 2, frameWidth, frameHeight, 12);
        frame.lineStyle(1, 0x3e6ba5, 0.9);
        frame.strokeRoundedRect(-frameWidth / 2, -frameHeight / 2, frameWidth, frameHeight, 12);

        const title = this.scene.add.text(
            -frameWidth / 2 + this.padding,
            -frameHeight / 2 + 2,
            label,
            {
                fontFamily: 'monospace',
                fontSize: '11px',
                color: '#a9d4ff',
                stroke: '#0b1a2a',
                strokeThickness: 2
            }
        );

        this.container.add(frame);
        this.container.add(title);
    }

    drawTiles() {
        const mapGraphics = this.scene.add.graphics();
        mapGraphics.setPosition(-this.mapWidth / 2, -this.mapHeight / 2 + 10);
        mapGraphics.fillStyle(0x111d2c, 1);
        mapGraphics.fillRect(0, 0, this.mapWidth, this.mapHeight);

        for (let y = 0; y < this.dungeon.height; y++) {
            for (let x = 0; x < this.dungeon.width; x++) {
                const tile = this.dungeon.tiles[y][x];
                if (tile !== TileType.FLOOR) {
                    continue;
                }
                const color = 0x2d7bba;
                mapGraphics.fillStyle(color, 0.85);
                mapGraphics.fillRect(
                    x * this.scale,
                    y * this.scale,
                    this.scale,
                    this.scale
                );
            }
        }

        mapGraphics.lineStyle(1, 0x3e6ba5, 0.35);
        mapGraphics.strokeRect(0, 0, this.mapWidth, this.mapHeight);

        this.container.add(mapGraphics);
        this.mapGraphics = mapGraphics;
    }

    createPlayerIndicator() {
        const size = Math.max(3, this.scale * 0.9);
        this.playerIndicator = this.scene.add.rectangle(0, 10, size, size, 0xf5e663, 1);
        this.playerIndicator.setOrigin(0.5);
        this.playerIndicator.setStrokeStyle(1, 0x0b1a2a, 0.9);
        this.container.add(this.playerIndicator);
    }

    updatePlayerPosition(tile) {
        if (!tile || (this.lastTile && this.lastTile.x === tile.x && this.lastTile.y === tile.y)) {
            return;
        }

        const x = -this.mapWidth / 2 + (tile.x + 0.5) * this.scale;
        const y = -this.mapHeight / 2 + 10 + (tile.y + 0.5) * this.scale;
        this.playerIndicator.setPosition(x, y);
        this.lastTile = { ...tile };
    }
}
