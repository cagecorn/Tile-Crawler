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
import { PlayerStatusManager } from '../engine/PlayerStatusManager.js';
import { ParticleAnimationEngine } from '../engine/ParticleAnimationEngine.js';
import { TextAnimationEngine } from '../engine/TextAnimationEngine.js';
import { PlayerVitalsWidget } from '../engine/PlayerVitalsWidget.js';
import { MovementManager } from '../managers/MovementManager.js';
import { PartyEngine } from '../managers/PartyEngine.js';
import { PartyFormationManager } from '../managers/PartyFormationManager.js';
import { PartyAiManager } from '../managers/PartyAiManager.js';
import { MercenaryRosterPanel } from '../engine/MercenaryRosterPanel.js';
import { UnitStatusPanel } from '../engine/UnitStatusPanel.js';
import { createDefaultItemEngine } from '../engine/ItemEngine.js';
import { createSharedInventory } from '../engine/InventoryEngine.js';
import { createEquipmentEngine } from '../engine/EquipmentEngine.js';
import { EquipmentPanel } from '../engine/EquipmentPanel.js';

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
        this.particleAnimationEngine = new ParticleAnimationEngine(this);
        this.textAnimationEngine = new TextAnimationEngine(this);
        this.actionOrderEngine = new ActionOrderEngine();
        this.turnEngine = new TurnEngine(this.actionOrderEngine);
        this.movementManager = new MovementManager({ turnEngine: this.turnEngine });
        this.offscreenEngine = new OffscreenEngine(this);
        this.specialEffectManager = new SpecialEffectManager(this, this.offscreenEngine);
        this.statManager = new StatManager();
        this.classManager = new ClassManager(this.statManager);
        this.turnEngine.setMovementManager(this.movementManager);
        this.combatEngine = new CombatEngine({
            turnEngine: this.turnEngine,
            specialEffectManager: this.specialEffectManager,
            particleAnimationEngine: this.particleAnimationEngine,
            textAnimationEngine: this.textAnimationEngine,
            logEngine: uiContext.logEngine
        });
        this.turnEngine.setCombatEngine(this.combatEngine);
        this.pathfindingEngine = new PathfindingEngine(this.dungeon, this.turnEngine);
        this.visionEngine = new VisionEngine(this.dungeon);
        this.itemEngine = createDefaultItemEngine();
        this.inventoryEngine = createSharedInventory(48);
        this.equipmentEngine = createEquipmentEngine();
        this.partyFormationManager = new PartyFormationManager({
            turnEngine: this.turnEngine,
            dungeon: this.dungeon,
            tileSize: this.tileSize,
            pathfindingEngine: this.pathfindingEngine
        });
        this.partyAiManager = new PartyAiManager({
            pathfindingEngine: this.pathfindingEngine,
            visionEngine: this.visionEngine,
            turnEngine: this.turnEngine,
            formationManager: this.partyFormationManager,
            movementManager: this.movementManager
        });

        this.createMinimap();
        this.initializeStatusPanels();

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
        this.initializeVitalsWidget();
        this.playerStatusPanel?.bindPlayer(this.player);
        this.initializePartySystems();
        this.seedStarterInventory();
        this.monsterManager = new MonsterManager({
            scene: this,
            dungeon: this.dungeon,
            tileSize: this.tileSize,
            animationEngine: this.animationEngine,
            specialEffectManager: this.specialEffectManager,
            turnEngine: this.turnEngine,
            statManager: this.statManager,
            pathfindingEngine: this.pathfindingEngine,
            visionEngine: this.visionEngine,
            movementManager: this.movementManager
        });
        this.monsterManager.spawnZombies();
        this.registerInput();
        this.trackUnitsOnMinimap();
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
            this.turnEngine,
            this.movementManager
        );
        this.cameras.main.startFollow(this.player.sprite, false, 0.12, 0.12);
        this.minimap?.updatePlayerPosition(spawnTile);
    }

    initializeStatusPanels()
    {
        this.statusManager = uiContext.statusManager ?? null;
        if (!this.statusManager) {
            return;
        }

        this.playerStatusPanel = this.statusManager.registerPanel('player', (container) => new PlayerStatusManager({
            container
        }), { mode: 'layer', title: '플레이어 스테이터스' });
        this.playerStatusPanel?.setEquipmentEngine?.(this.equipmentEngine);

        this.equipmentPanel = this.statusManager.registerPanel('equipment', (container) => new EquipmentPanel({
            container,
            inventoryEngine: this.inventoryEngine,
            equipmentEngine: this.equipmentEngine,
            itemEngine: this.itemEngine,
            unitProvider: () => this.getNavigableUnits()
        }), { mode: 'layer', title: '장비 관리' });

        this.statusManager.registerPanel('skills', (container) => {
            container.innerHTML = '';
            const notice = document.createElement('div');
            notice.className = 'ui-status-card ui-status-player';
            notice.textContent = '스킬 북이 준비 중입니다.';
            container.appendChild(notice);
        }, { mode: 'layer', title: '스킬 북' });
    }

    initializePartySystems()
    {
        this.partyEngine = new PartyEngine({
            scene: this,
            player: this.player,
            dungeon: this.dungeon,
            tileSize: this.tileSize,
            animationEngine: this.animationEngine,
            specialEffectManager: this.specialEffectManager,
            turnEngine: this.turnEngine,
            movementManager: this.movementManager,
            formationManager: this.partyFormationManager,
            aiManager: this.partyAiManager,
            classManager: this.classManager,
            statManager: this.statManager,
            logEngine: uiContext.logEngine,
            minimap: this.minimap,
            equipmentEngine: this.equipmentEngine
        });

        this.registerPartyPanels();
        this.registerHireButton();
        this.playerStatusPanel?.setNavigator(() => this.getNavigableUnits());
        this.partyEngine?.onChange(() => {
            this.playerStatusPanel?.refreshNavigation?.();
            this.equipmentPanel?.refreshNavigation();
        });
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

    initializeVitalsWidget()
    {
        const container = uiContext.playerStatusContainer ?? null;
        if (!container) {
            return;
        }

        this.playerVitalsWidget = new PlayerVitalsWidget({ container });
        if (this.player) {
            this.playerVitalsWidget.bindPlayer(this.player);
        }
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
            this.partyEngine?.planTurn(this.player, this.monsterManager?.getMonsters() ?? []);
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

    trackUnitsOnMinimap()
    {
        if (!this.minimap) {
            return;
        }

        this.events.on('unit-moved', ({ unit, tile }) => {
            if (unit === this.player) {
                this.minimap.updatePlayerPosition(tile);
                return;
            }

            if (unit.faction === 'undead') {
                this.minimap.updateMonsterPosition(unit, tile);
                return;
            }

            if (unit.faction === 'allies') {
                this.minimap.updateAllyPosition(unit, tile);
            }
        });

        this.events.on('unit-died', ({ unit }) => {
            if (unit.faction === 'undead') {
                this.minimap.removeMonster(unit);
                return;
            }
            if (unit.faction === 'allies') {
                this.minimap.removeAlly(unit);
            }
        });

        this.minimap.setMonsterPositions(this.monsterManager?.getMonsters() ?? []);
        this.minimap.setAllies(this.partyEngine?.getPartyOrder?.(false) ?? []);
    }

    registerPartyPanels()
    {
        if (!this.statusManager || !this.partyEngine) {
            return;
        }

        this.mercenaryRosterPanel = this.statusManager.registerPanel('mercenaries', (container) => new MercenaryRosterPanel({
            container,
            partyEngine: this.partyEngine,
            onSelect: (unit) => this.showMercenaryStatus(unit)
        }), { mode: 'layer', title: '용병 관리' });

        this.mercenaryStatusPanel = this.statusManager.registerPanel('mercenary-status', (container) => new UnitStatusPanel({
            container
        }), { mode: 'layer', title: '용병 스테이터스' });
    }

    registerHireButton()
    {
        const hireButton = uiContext.hireSentinelButton ?? null;
        if (!hireButton || !this.partyEngine) {
            return;
        }

        hireButton.addEventListener('click', () => {
            this.partyEngine.hireSentinel();
            this.mercenaryRosterPanel?.refresh();
        });
    }

    showMercenaryStatus(unit)
    {
        if (!unit || !this.mercenaryStatusPanel) {
            return;
        }
        this.mercenaryStatusPanel.bindUnit(unit);
        this.statusManager?.show('mercenary-status');
    }

    getNavigableUnits()
    {
        const partyUnits = this.partyEngine?.getPartyOrder?.(false) ?? [];
        const uniqueUnits = new Set([this.player, ...partyUnits]);
        return Array.from(uniqueUnits).filter(Boolean);
    }

    seedStarterInventory()
    {
        const starterItems = [
            this.itemEngine?.createInstance('short-axe'),
            this.itemEngine?.createInstance('plate-armor')
        ].filter(Boolean);

        starterItems.forEach((item) => {
            this.inventoryEngine?.addItem(item);
        });

        if (this.player) {
            this.equipmentEngine?.registerUnit(this.player);
        }
    }
}
