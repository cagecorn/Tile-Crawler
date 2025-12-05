import { Scene } from 'phaser';
import { DungeonGenerator, TileType } from '../dungeon/DungeonGenerator.js';
import { measurementManager } from '../config/MeasurementManager.js';
import { TurnEngine } from '../engine/TurnEngine.js';
import { AnimationEngine } from '../engine/AnimationEngine.js';
import { OffscreenEngine } from '../engine/OffscreenEngine.js';
import { SpecialEffectManager } from '../engine/SpecialEffectManager.js';
import { CombatEngine } from '../engine/CombatEngine.js';
import { PathfindingEngine } from '../engine/PathfindingEngine.js';
import { VisionEngine } from '../engine/VisionEngine.js';
import { ActionOrderEngine } from '../engine/ActionOrderEngine.js';
import { ClassManager } from '../managers/ClassManager.js';
import { StatManager } from '../managers/StatManager.js';
import { MonsterManager } from '../managers/MonsterManager.js';
import { PlayerUnit } from '../units/Player.js';
import { MinimapEngine } from '../engine/MinimapEngine.js';
import { uiContext } from '../engine/UiContext.js';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    create ()
    {
        const generator = new DungeonGenerator(measurementManager);
        const dungeon = generator.generate();
        const tileSize = measurementManager.getTileSize();
        const cameraConfig = measurementManager.getCameraConfig();
        this.dungeon = dungeon;
        this.tileSize = tileSize;

        this.animationEngine = new AnimationEngine(this);
        this.actionOrderEngine = new ActionOrderEngine();
        this.turnEngine = new TurnEngine(this.actionOrderEngine);
        this.offscreenEngine = new OffscreenEngine(this);
        this.specialEffectManager = new SpecialEffectManager(this, this.offscreenEngine);
        this.statManager = new StatManager();
        this.classManager = new ClassManager(this.statManager);
        this.combatEngine = new CombatEngine(this.turnEngine, this.specialEffectManager);
        this.turnEngine.setCombatEngine(this.combatEngine);
        this.pathfindingEngine = new PathfindingEngine(this.dungeon, this.turnEngine);
        this.visionEngine = new VisionEngine(this.dungeon);

        this.createMinimap();

        const mapLayer = this.add.layer();
        for (let y = 0; y < dungeon.height; y++) {
            for (let x = 0; x < dungeon.width; x++) {
                const tile = dungeon.tiles[y][x];
                const textureKey = tile === TileType.FLOOR ? 'floor-tile-1' : 'wall-tile-1';
                const image = this.add.image(
                    x * tileSize + tileSize / 2,
                    y * tileSize + tileSize / 2,
                    textureKey
                );
                mapLayer.add(image);
            }
        }

        const worldWidth = dungeon.width * tileSize;
        const worldHeight = dungeon.height * tileSize;
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.setBackgroundColor(0x000000);
        this.cameras.main.centerOn(worldWidth / 2, worldHeight / 2);
        this.cameras.main.setZoom(cameraConfig.defaultZoom);

        this.enableCameraDrag();
        this.enableCameraZoom(cameraConfig);
        this.setupPlayer();
        this.monsterManager = new MonsterManager({
            scene: this,
            dungeon: this.dungeon,
            tileSize: this.tileSize,
            animationEngine: this.animationEngine,
            specialEffectManager: this.specialEffectManager,
            turnEngine: this.turnEngine,
            statManager: this.statManager,
            pathfindingEngine: this.pathfindingEngine,
            visionEngine: this.visionEngine
        });
        this.monsterManager.spawnZombies();
        this.registerInput();
        this.trackPlayerOnMinimap();
    }

    enableCameraDrag ()
    {
        const camera = this.cameras.main;
        this.input.on('pointermove', (pointer) => {
            if (!pointer.isDown) {
                return;
            }

            camera.scrollX -= (pointer.x - pointer.prevPosition.x) / camera.zoom;
            camera.scrollY -= (pointer.y - pointer.prevPosition.y) / camera.zoom;
        });
    }

    enableCameraZoom (cameraConfig)
    {
        const camera = this.cameras.main;
        const { minZoom, maxZoom, zoomStep } = cameraConfig;

        this.input.on('wheel', (_pointer, _gameObjects, _deltaX, deltaY) => {
            const zoomDelta = deltaY > 0 ? -zoomStep : zoomStep;
            const newZoom = Math.min(maxZoom, Math.max(minZoom, camera.zoom + zoomDelta));

            if (newZoom !== camera.zoom) {
                camera.setZoom(newZoom);
            }
        });
    }

    setupPlayer()
    {
        const spawnTile = this.pickSpawnTile();
        this.player = new PlayerUnit(
            this,
            spawnTile,
            this.tileSize,
            this.animationEngine,
            this.dungeon,
            this.classManager,
            this.specialEffectManager,
            this.turnEngine
        );
        this.cameras.main.startFollow(this.player.sprite, false, 0.12, 0.12);
        this.minimap?.updatePlayerPosition(spawnTile);
    }

    pickSpawnTile()
    {
        if (this.dungeon.rooms.length > 0) {
            const room = this.dungeon.rooms[0];
            return {
                x: Math.floor(room.x + room.width / 2),
                y: Math.floor(room.y + room.height / 2)
            };
        }

        for (let y = 0; y < this.dungeon.height; y++) {
            for (let x = 0; x < this.dungeon.width; x++) {
                if (this.dungeon.tiles[y][x] === TileType.FLOOR) {
                    return { x, y };
                }
            }
        }
        return { x: 1, y: 1 };
    }

    registerInput()
    {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown', (event) => {
            const action = this.translateKeyToAction(event.code);
            if (!action) {
                return;
            }

            this.turnEngine.queueAction(this.player, action);
            this.monsterManager.planTurn(this.player);
            this.turnEngine.resolveTurn();
        });
    }

    translateKeyToAction(keyCode)
    {
        switch (keyCode) {
        case 'ArrowLeft':
            return { type: 'move', dx: -1, dy: 0 };
        case 'ArrowRight':
            return { type: 'move', dx: 1, dy: 0 };
        case 'ArrowUp':
            return { type: 'move', dx: 0, dy: -1 };
        case 'ArrowDown':
            return { type: 'move', dx: 0, dy: 1 };
        default:
            return null;
        }
    }

    update()
    {
        if (this.specialEffectManager) {
            this.specialEffectManager.update();
        }
    }

    createMinimap()
    {
        if (!uiContext.minimapViewport) {
            return;
        }

        this.minimap = new MinimapEngine({
            container: uiContext.minimapViewport,
            dungeon: this.dungeon
        });
    }

    trackPlayerOnMinimap()
    {
        if (!this.minimap) {
            return;
        }

        this.events.on('unit-moved', ({ unit, tile }) => {
            if (unit === this.player) {
                this.minimap.updatePlayerPosition(tile);
            }
        });
    }
}
