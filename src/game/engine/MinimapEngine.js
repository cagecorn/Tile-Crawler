import { TileType } from '../dungeon/DungeonGenerator.js';

export class MinimapEngine {
    constructor({ container, dungeon }) {
        this.container = container;
        this.dungeon = dungeon;
        this.scale = 1;
        this.canvas = null;
        this.playerMarker = null;

        this.setupViewport();
    }

    setupViewport() {
        if (!this.container) {
            return;
        }

        this.container.innerHTML = '';
        this.container.classList.add('ui-minimap-ready');

        this.canvas = document.createElement('canvas');
        this.container.appendChild(this.canvas);

        this.playerMarker = document.createElement('div');
        this.playerMarker.className = 'ui-minimap-player';
        this.container.appendChild(this.playerMarker);

        this.drawDungeon();
    }

    drawDungeon() {
        if (!this.canvas || !this.dungeon) {
            return;
        }

        const maxSize = 220;
        this.scale = Math.min(maxSize / this.dungeon.width, maxSize / this.dungeon.height);
        const width = Math.ceil(this.dungeon.width * this.scale);
        const height = Math.ceil(this.dungeon.height * this.scale);

        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;

        const context = this.canvas.getContext('2d');
        context.fillStyle = '#0c1016';
        context.fillRect(0, 0, width, height);

        for (let y = 0; y < this.dungeon.height; y++) {
            for (let x = 0; x < this.dungeon.width; x++) {
                const tile = this.dungeon.tiles[y][x];
                const color = tile === TileType.FLOOR ? '#2dd4bf' : '#16202c';
                context.fillStyle = color;
                context.fillRect(
                    Math.floor(x * this.scale),
                    Math.floor(y * this.scale),
                    Math.ceil(this.scale),
                    Math.ceil(this.scale)
                );
            }
        }
    }

    updatePlayerPosition(tilePosition) {
        if (!tilePosition || !this.playerMarker) {
            return;
        }

        const x = tilePosition.x * this.scale + this.scale / 2;
        const y = tilePosition.y * this.scale + this.scale / 2;
        this.playerMarker.style.transform = `translate(${x}px, ${y}px)`;
    }
}
